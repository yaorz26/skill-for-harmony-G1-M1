import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { executeChecks } from './lib/evidence.mjs';
import { captureSource } from './lib/source-snapshot.mjs';

test('records success, failure, timeout and spawn errors without stopping later checks', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'g1m1 evidence '));
  try {
    const result = await executeChecks([
      { name: 'success', command: process.execPath, args: ['-e', 'console.log("fixture success")'] },
      { name: 'failure', command: process.execPath, args: ['-e', 'console.error("fixture failure"); process.exit(7)'] },
      { name: 'timeout', command: process.execPath, args: ['-e', 'setInterval(() => {}, 1000)'], timeoutMs: 100 },
      { name: 'missing', command: join(temp, 'does-not-exist'), args: [] },
      { name: 'last', command: process.execPath, args: ['-e', 'console.log("last")'] }
    ], { cwd: temp, outputDir: join(temp, 'records') });
    assert.deepEqual(result.map(x => x.status), ['passed', 'failed', 'timeout', 'failed', 'passed']);
    assert.equal(result[1].exitCode, 7);
    assert.match(readFileSync(join(temp, 'records', 'failure.log'), 'utf8'), /fixture failure/);
    assert.match(result[3].error, /ENOENT/);
    assert.match(result[0].sha256, /^[a-f0-9]{64}$/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('refuses overwriting records and unsafe or duplicate check names before executing', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'g1m1 evidence '));
  try {
    const marker = join(temp, 'keep.txt');
    writeFileSync(marker, 'keep');
    await assert.rejects(executeChecks([], { cwd: temp, outputDir: temp }), /already exists/);
    const check = { name: '../escape', command: process.execPath, args: [] };
    await assert.rejects(executeChecks([check], { cwd: temp, outputDir: join(temp, 'unsafe') }), /name/);
    check.name = 'same';
    await assert.rejects(executeChecks([check, check], { cwd: temp, outputDir: join(temp, 'duplicate') }), /name/);
    assert.equal(readFileSync(marker, 'utf8'), 'keep');
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('source fingerprint detects edits, additions and tracked-file deletion', () => {
  const temp = mkdtempSync(join(tmpdir(), 'g1m1 source '));
  try {
    execFileSync('git', ['init', '-q'], { cwd: temp, windowsHide: true });
    mkdirSync(join(temp, 'entry'));
    const tracked = join(temp, 'entry', 'tracked.txt');
    writeFileSync(tracked, 'original');
    execFileSync('git', ['add', 'entry/tracked.txt'], { cwd: temp, windowsHide: true });
    const initial = captureSource(temp).fingerprint;
    writeFileSync(tracked, 'changed');
    assert.notEqual(captureSource(temp).fingerprint, initial);
    writeFileSync(tracked, 'original');
    const added = join(temp, 'entry', 'added.txt');
    writeFileSync(added, 'new');
    assert.notEqual(captureSource(temp).fingerprint, initial);
    unlinkSync(added);
    unlinkSync(tracked);
    assert.throws(() => captureSource(temp), /ENOENT/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('timeout ends a child that ignores SIGTERM', { skip: process.platform === 'win32' }, async () => {
  const temp = mkdtempSync(join(tmpdir(), 'g1m1 stubborn '));
  try {
    const start = Date.now();
    const results = await executeChecks([{ name: 'stubborn', command: process.execPath,
      args: ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)'], timeoutMs: 100 }],
    { cwd: temp, outputDir: join(temp, 'records') });
    assert.equal(results[0].status, 'timeout');
    assert.ok(Date.now() - start < 3000);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
