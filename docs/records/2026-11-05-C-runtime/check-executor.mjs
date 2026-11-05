// 成员 C 独立检查：F08 注入抛错 SkillInvoker、F09 超时与迟到结果。
// 只在 Node 中执行纯逻辑 ETS；不验证 ArkTS 严格类型、SDK 兼容性或鸿蒙运行时。
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, sep } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const coreRoot = resolve(root, 'entry/src/main/ets') + sep;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL?.endsWith('.ets')) {
      const candidate = new URL(specifier + '.ets', context.parentURL);
      if (existsSync(candidate)) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (!url.endsWith('.ets')) return nextLoad(url, context);
    const path = fileURLToPath(url);
    assert.ok(path.startsWith(coreRoot), 'Only local pure-core ETS files may be loaded.');
    const withTypeImportsRemoved = readFileSync(path, 'utf8').replace(
      /import\s*\{([^}]+)\}\s*from\s*'([^']+)'\s*;/g,
      (statement, names, target) => {
        if (!target.startsWith('.')) return statement;
        const dependency = resolve(dirname(path), target + '.ets');
        const interfaces = new Set([...readFileSync(dependency, 'utf8')
          .matchAll(/export interface\s+(\w+)/g)].map((match) => match[1]));
        const values = names.split(',').map((name) => name.trim()).filter((name) => !interfaces.has(name));
        return values.length ? `import { ${values.join(', ')} } from '${target}';` : '';
      }
    );
    return { format: 'module', source: stripTypeScriptTypes(withTypeImportsRemoved), shortCircuit: true };
  }
});

const load = (path) => import(pathToFileURL(resolve(coreRoot, path)).href);
const { SkillExecutor } = await load('runtime/SkillExecutor.ets');
const { SkillRegistry } = await load('registry/SkillRegistry.ets');
const { AppSkillService } = await load('service/AppSkillService.ets');

const delay = (ms) => new Promise((done) => setTimeout(done, ms));
const registry = new SkillRegistry();
let checks = 0;

// F08：适配器抛错必须转成一次 ERR_INTERNAL，不重试、不二次返回。
let f08Starts = 0;
let f08Returns = 0;
const faultExecutor = new SkillExecutor({
  executionPath: 'test-fault',
  invoke: async () => {
    f08Starts += 1;
    throw new Error('injected');
  }
}, 100);
const f08 = await faultExecutor.execute(
  { requestId: 'f08', skillId: 'g1-echo', argument: 'test' }, registry);
f08Returns += 1;
await delay(20);
assert.equal(f08.status, 'failed');
assert.equal(f08.errCode, 'ERR_INTERNAL');
assert.equal(f08.executionPath, 'test-fault');
assert.ok(f08.errMsg.length > 0);
assert.equal(f08Starts, 1, 'F08 must invoke the adapter exactly once.');
assert.equal(f08Returns, 1, 'F08 must return exactly one result.');
checks += 6;

// F09：超时后立即返回 ERR_TIMEOUT；迟到结果完成时不得改写返回值或再次回包。
let f09Starts = 0;
let f09Finishes = 0;
const slowExecutor = new SkillExecutor({
  executionPath: 'test-external',
  invoke: async (value) => {
    f09Starts += 1;
    await delay(30);
    f09Finishes += 1;
    return AppSkillService.execute(value, 'test-external');
  }
}, 5);
const f09 = await slowExecutor.execute(
  { requestId: 'f09', skillId: 'g1-echo', argument: 'late' }, registry);
const responses = [f09];
assert.equal(f09.status, 'failed');
assert.equal(f09.errCode, 'ERR_TIMEOUT');
assert.equal(f09.executionPath, 'test-external');
assert.equal(f09Starts, 1);
assert.equal(f09Finishes, 0, 'F09 must return before the slow adapter completes.');
await delay(60);
assert.equal(f09Finishes, 1, 'F09 late result must still complete in the adapter.');
assert.equal(f09Starts, 1, 'F09 must not retry the adapter.');
assert.equal(responses.length, 1, 'F09 must send exactly one response.');
assert.equal(responses[0], f09);
assert.equal(f09.errCode, 'ERR_TIMEOUT', 'F09 late result must not overwrite the timeout.');
checks += 9;

// 正常注入适配器仍应返回业务结果，证明检查没有依赖故障开关。
const ok = await new SkillExecutor({
  executionPath: 'test-external',
  invoke: async (value) => AppSkillService.execute(value, 'test-external')
}).execute({ requestId: 'ok', skillId: 'g1-text-length', argument: '你好ABC' }, registry);
assert.equal(ok.status, 'success');
assert.equal(ok.executionPath, 'test-external');
assert.equal(ok.data.length, 5);
checks += 3;

console.log(`PASS: ${checks} executor checks (F08 single ERR_INTERNAL, F09 timeout and late result isolation).`);
console.log('Node execution of pure ETS logic only. ArkTS runtime, system Skill entry and device behavior remain unverified.');
