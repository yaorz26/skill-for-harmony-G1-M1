// Recheck D's committed evidence. This does not connect to or execute on a device.
import assert from 'node:assert/strict';
import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../2026-11-07-D-system-skill');
const cases = [
  { file: 'echo-hilog.txt', skillId: 'g1-echo', script: 'EchoSkill.ets', method: 'echo',
    text: 'T8P2-鸿蒙-47', requestId: '7' },
  { file: 'length-hilog.txt', skillId: 'g1-text-length', script: 'TextLengthSkill.ets', method: 'measure',
    text: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0😀', requestId: '6' }
];
const results = [];
for (const test of cases) {
  const lines = [];
  for await (const line of createInterface({ input: createReadStream(resolve(source, test.file)), crlfDelay: Infinity })) {
    if (/execCli2 payload=|Dispatch to skill path|srcEntry:|\[G1M1\]|stdOut:|replyCliResult payload=/.test(line)) {
      lines.push(line);
    }
  }
  const one = (marker) => {
    const matches = lines.filter(line => line.includes(marker));
    assert.equal(matches.length, 1, `${test.file}: expected one ${marker}`);
    return matches[0];
  };
  const payload = JSON.parse(one('execCli2 payload=').split('execCli2 payload=')[1]);
  assert.equal(payload.skillName, test.skillId);
  assert.ok(payload.command.includes(`--skillName '${test.skillId}'`));
  assert.ok(payload.command.includes(`--scriptPath 'scripts/${test.script}'`));
  assert.ok(payload.command.includes(`--functionName '${test.method}'`));
  assert.equal(JSON.parse(payload.command.match(/--args '(.+)'$/u)[1]).arg1, test.text);
  one('Dispatch to skill path');
  assert.ok(one('srcEntry:').includes(`skills/${test.skillId}/scripts/${test.script}`));
  const events = lines.filter(line => line.includes('[G1M1] '))
    .map(line => JSON.parse(line.split('[G1M1] ')[1]));
  assert.deepEqual(events.map(event => event.stage), ['system_skill_entered', 'system_result_reported']);
  for (const event of events) {
    assert.equal(event.requestId, test.requestId);
    assert.equal(event.skillId, test.skillId);
    assert.equal(event.executionPath, 'system-skill');
    assert.equal(event.errCode, '');
  }
  const result = JSON.parse(one('stdOut:').split('stdOut:')[1].split(', stdErr:')[0].trim());
  assert.equal(result.requestId, test.requestId);
  assert.equal(result.skillId, test.skillId);
  assert.equal(result.executionPath, 'system-skill');
  assert.equal(result.status, 'success');
  assert.equal(result.data.text, test.text);
  if (test.skillId === 'g1-text-length') {
    assert.equal(test.text.length, 42);
    assert.equal(result.data.length, 42);
    assert.equal(result.data.unit, 'utf16-code-unit');
  }
  const reply = JSON.parse(one('replyCliResult payload=').split('replyCliResult payload=')[1]);
  assert.deepEqual(JSON.parse(reply.data), result);
  results.push({ file: test.file, skillId: test.skillId, requestId: test.requestId,
    expectedText: test.text, result, matchedDispatchEntryReportAndReply: true });
}
assert.notEqual(results[0].requestId, results[1].requestId);
const files = ['report.md', 'echo-hilog.txt', 'length-hilog.txt', 'echo-expanded.jpeg',
  'length-expanded.jpeg', 'length-clean.jpeg', 'invalid-attempt.jpeg'].map(file => ({
    file, sha256: createHash('sha256').update(readFileSync(resolve(source, file))).digest('hex')
  }));
const review = {
  sourceCommit: '34899adbda8270463566632ecd7e066391d9bb07',
  kind: 'review-of-existing-evidence', newDeviceExecution: false,
  sourceCodeCommit: 'ab9691fda02a87c40cc162b166128b1a4d37aa46',
  signedHapSha256: 'AE81F666F362D7176E8390296F749EF178C6D5C0DE59B18D99FED40006DF8B20',
  S01: 'passed-on-D-Pura70', S02Normal: 'passed-on-D-Pura70',
  S02InvalidArguments: 'not-verified',
  A01: 'not-verified', A02: 'blocked', A03: 'not-verified', E01: 'not-verified',
  cases: results, files
};
writeFileSync(resolve(here, 'd-evidence-review.json'), JSON.stringify(review, null, 2) + '\n');
console.log('PASS: both committed D traces match dispatch, script entry, result reporting and XiaoYi receipt.');
console.log('S01 and S02 normal path only; no new device execution and no A01/A02/A03/E01 pass.');
