// Collect reproducible host checks. This never certifies an assembled Demo or a device path.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeChecks } from './lib/evidence.mjs';
import { captureSource } from './lib/source-snapshot.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required.');
  if (process.argv.length !== 4 || process.argv[2] !== '--out') throw new Error('Usage: node tools/run-acceptance.mjs --out <new-directory>');
  const out = resolve(process.argv[3]);
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  const source = captureSource(root);
  const before = { commit: git(['rev-parse', 'HEAD']).trim(), branch: git(['branch', '--show-current']).trim(),
    workingTreeStatus: git(['status', '--short']).trim(), sourceFiles: source.files, fingerprint: source.fingerprint };
  const checks = [
    { name: 'structure', args: ['tools/check-structure.mjs'] },
    { name: 'core', args: ['tools/check-core.mjs'] },
    { name: 'a-entry', args: ['docs/records/2026-11-04-A-integration/check-entry.mjs'] },
    { name: 'c-executor', args: ['docs/records/2026-11-05-C-runtime/check-executor.mjs'] },
    { name: 'evidence-tool', args: ['--test', 'tools/check-evidence.test.mjs'] }
  ].map(check => ({ ...check, command: process.execPath }));
  const startedAt = new Date().toISOString();
  const results = await executeChecks(checks, { cwd: root, outputDir: out });
  let sourceStable = false;
  let sourceVerificationError = '';
  try {
    sourceStable = captureSource(root).fingerprint === before.fingerprint && git(['rev-parse', 'HEAD']).trim() === before.commit;
  } catch (error) { sourceVerificationError = error.message; }
  const passed = sourceStable && results.every(result => result.status === 'passed');
  const manifest = { schemaVersion: 1, scope: 'host-only-baseline', startedAt, finishedAt: new Date().toISOString(),
    node: process.version, platform: process.platform, architecture: process.arch, source: before, sourceStable,
    sourceVerificationError,
    results, status: passed ? 'passed' : 'failed',
    unverified: ['ArkTS compilation', 'IDE sync', 'installation', 'device runtime', 'system Skill', 'AgentExtensionAbility', 'end-to-end acceptance'] };
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(join(out, 'summary.md'), `# Host baseline checks\n\nScope: host-only-baseline. This is not final device acceptance.\n\nCommit: \`${before.commit}\`\n\nSource fingerprint: \`${before.fingerprint}\`\n\nWorking tree has changes: ${Boolean(before.workingTreeStatus)}\n\nSource unchanged during checks: ${sourceStable}\n\n| Check | Status | Exit code | Log |\n| --- | --- | --- | --- |\n` +
    results.map(r => `| ${r.name} | ${r.status} | ${r.exitCode ?? 'none'} | [log](${r.logFile}) |`).join('\n') +
    (sourceVerificationError ? `\n\nSource verification error: ${sourceVerificationError}\n` : '\n'));
  console.log(`${passed ? 'PASS' : 'FAIL'}: host-only evidence written to ${out}`);
  process.exitCode = passed ? 0 : 1;
} catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
