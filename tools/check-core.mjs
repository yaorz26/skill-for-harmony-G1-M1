// 在 Node 中运行纯逻辑 ETS 的 TypeScript 子集；不加载 ArkUI 或 HarmonyOS API。
// 不验证 ArkTS 严格类型规则、SDK 兼容性、系统 Skill 或设备行为。
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, sep } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
    if (url.endsWith('.ets')) {
      const path = fileURLToPath(url);
      assert.ok(path.startsWith(coreRoot), 'Only local pure-core ETS files may be loaded.');
      // ArkTS 的普通 import 可包含接口；Node 类型擦除不会自动删除这些导入。
      // 仅在检查加载器中移除局部源码显式 export interface 的名称。
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
      const source = stripTypeScriptTypes(withTypeImportsRemoved);
      return { format: 'module', source, shortCircuit: true };
    }
    return nextLoad(url, context);
  }
});

const load = (path) => import(pathToFileURL(resolve(coreRoot, path)).href);
const { AgentService } = await load('agent/AgentService.ets');
const { SkillExecutor } = await load('runtime/SkillExecutor.ets');
const { SkillRegistry } = await load('registry/SkillRegistry.ets');
const { AppSkillService } = await load('service/AppSkillService.ets');

let checks = 0;
const agent = new AgentService();
for (const [text, status, code, skillId] of [
  ['回显 你好，鸿蒙', 'success', '', 'g1-echo'],
  ['echo test', 'success', '', 'g1-echo'],
  ['长度 你好ABC', 'success', '', 'g1-text-length'],
  ['字数 😀', 'success', '', 'g1-text-length'],
  ['查天气', 'failed', 'ERR_NO_SKILL', ''],
  ['回显xxx', 'failed', 'ERR_NO_SKILL', ''],
  ['回显', 'failed', 'ERR_INVALID_PARAMS', 'g1-echo'],
  ['', 'failed', 'ERR_INVALID_PARAMS', ''],
  ['回显 ' + 'a'.repeat(1025), 'failed', 'ERR_INVALID_PARAMS', 'g1-echo'],
  ['a'.repeat(1101), 'failed', 'ERR_INVALID_PARAMS', '']
]) {
  const requestId = `smoke-${++checks}`;
  const result = await agent.handle({ requestId, text });
  assert.equal(result.requestId, requestId);
  assert.equal(result.status, status);
  assert.equal(result.errCode, code);
  assert.equal(result.skillId, skillId);
  assert.equal(result.executionPath, 'in-app');
}
const length = await agent.handle({ requestId: 'length', text: '长度 你好ABC' });
assert.equal(length.data.length, 5);
assert.equal(length.data.unit, 'utf16-code-unit');
const emoji = await agent.handle({ requestId: 'emoji', text: '长度 😀' });
assert.equal(emoji.data.length, 2);
const echo = await agent.handle({ requestId: 'echo', text: '回显 你好，鸿蒙' });
assert.equal(echo.data.text, '你好，鸿蒙');
checks += 3;

for (const [count, status, code] of [[512, 'success', ''], [513, 'failed', 'ERR_INVALID_PARAMS']]) {
  const result = AppSkillService.execute({
    requestId: `unicode-boundary-${count}`, skillId: 'g1-text-length', argument: '😀'.repeat(count)
  }, 'in-app');
  assert.equal(result.status, status);
  assert.equal(result.errCode, code);
  if (status === 'success') assert.equal(result.data.length, 1024);
  checks++;
}

const registry = new SkillRegistry();
const call = { requestId: 'runtime', skillId: 'g1-echo', argument: 'test' };
const throwing = new SkillExecutor({ executionPath: 'in-app', invoke: async () => { throw new Error('injected'); } });
assert.equal((await throwing.execute(call, registry)).errCode, 'ERR_INTERNAL');
assert.equal((await throwing.execute({ ...call, skillId: 'unknown' }, registry)).errCode, 'ERR_NO_SKILL');
assert.equal((await throwing.execute({ ...call, argument: '' }, registry)).errCode, 'ERR_INVALID_PARAMS');
checks += 3;

let completed = 0;
const slow = new SkillExecutor({
  executionPath: 'test-external',
  invoke: async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 30));
    completed++;
    return AppSkillService.execute(value, 'test-external');
  }
}, 2);
const timedOut = await slow.execute(call, registry);
assert.equal(timedOut.errCode, 'ERR_TIMEOUT');
assert.equal(timedOut.executionPath, 'test-external');
await new Promise((resolve) => setTimeout(resolve, 45));
assert.equal(completed, 1);
assert.equal(timedOut.errCode, 'ERR_TIMEOUT', 'Late completion must not overwrite the returned timeout.');
checks++;

const external = new AgentService({
  executionPath: 'test-external',
  invoke: async (value) => AppSkillService.execute(value, 'test-external')
});
const externalSuccess = await external.handle({ requestId: 'external-success', text: '回显 test' });
assert.equal(externalSuccess.status, 'success');
assert.equal(externalSuccess.executionPath, 'test-external');
const externalUnmatched = await external.handle({ requestId: 'external-unmatched', text: 'unknown' });
assert.equal(externalUnmatched.errCode, 'ERR_NO_SKILL');
assert.equal(externalUnmatched.executionPath, 'test-external');
const externalInvalid = await external.handle({ requestId: 'external-invalid', text: '' });
assert.equal(externalInvalid.errCode, 'ERR_INVALID_PARAMS');
assert.equal(externalInvalid.executionPath, 'test-external');
const externalFailure = await new AgentService({
  executionPath: 'test-external', invoke: async () => { throw new Error('external failure'); }
}).handle({ requestId: 'external-error', text: '回显 test' });
assert.equal(externalFailure.errCode, 'ERR_INTERNAL');
assert.equal(externalFailure.executionPath, 'test-external');
checks += 4;

console.log(`PASS: ${checks} core checks (routing, parameters, Unicode length, errors and late completion).`);
console.log('Node execution of pure ETS logic only. ArkTS compilation and HarmonyOS runtime remain unverified.');
