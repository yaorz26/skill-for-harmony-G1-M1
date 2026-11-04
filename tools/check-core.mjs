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

const { AgentRequestBridge } = await load('agentextension/AgentRequestBridge.ets');
const localInvoker = { executionPath: 'in-app', invoke: async (value) => AppSkillService.execute(value, 'in-app') };
const { IntentRouter } = await load('router/IntentRouter.ets');
const customRegistry = new SkillRegistry([{ id: 'g1-echo', name: '回显', prefixes: ['say'] }]);
const configured = new AgentService(localInvoker, new IntentRouter(), customRegistry);
assert.equal(configured.supportedHint(), '支持：say 文本');
assert.equal((await configured.handle({ requestId: 'configured', text: 'say x' })).data.text, 'x');
assert.equal((await configured.handle({ requestId: 'hint', text: '长度 x' })).errMsg, '支持：say 文本');
checks++;
const routerError = new AgentService(localInvoker, { route: () => { throw new Error('injected'); } });
assert.equal((await routerError.handle({ requestId: 'router-error', text: '回显 x' })).errCode, 'ERR_INTERNAL');
checks++;
let unauthorizedCalls = 0;
const rogueRouter = new AgentService({ executionPath: 'in-app', invoke: async (value) => {
  unauthorizedCalls++;
  return AppSkillService.execute(value, 'in-app');
} }, { route: () => ({ matched: true, skillId: 'not-registered', argument: 'x' }) });
assert.equal((await rogueRouter.handle({ requestId: 'rogue', text: '回显 x' })).errCode, 'ERR_NO_SKILL');
assert.equal(unauthorizedCalls, 0, 'Injected routers must not bypass the registry.');
checks++;

const bridge = new AgentRequestBridge();
const submit = async (target, requestId, text = '回显 x') => JSON.parse(await target.handle(JSON.stringify({ requestId, text })));
const bridged = await submit(bridge, 'bridge-success');
assert.equal(bridged.data.text, 'x');
assert.equal(bridged.requestId, 'bridge-success');
assert.equal(bridged.executionPath, 'in-app', 'Extension ingress must not masquerade as system Skill execution.');
checks++;
for (const invalid of ['', '{', 'null', '[]', '42', '"回显 x"', '{}',
  JSON.stringify({ requestId: 42, text: '回显 x' }),
  JSON.stringify({ requestId: ' ', text: '回显 x' }),
  JSON.stringify({ requestId: 'a'.repeat(129), text: '回显 x' }),
  JSON.stringify({ requestId: ' trimmed ', text: '回显 x' }),
  'a'.repeat(8193)]) {
  const rejected = JSON.parse(await bridge.handle(invalid));
  assert.equal(rejected.errCode, 'ERR_INVALID_PARAMS');
  assert.equal(rejected.requestId, '');
  checks++;
}
for (const fields of [{ text: 42 }, { text: '' }, { text: 'a'.repeat(1101) },
  { text: '回显 x', skillId: 'arbitrary' }]) {
  const rejected = JSON.parse(await bridge.handle(JSON.stringify({ requestId: 'invalid-fields', ...fields })));
  assert.equal(rejected.errCode, 'ERR_INVALID_PARAMS');
  assert.equal(rejected.requestId, 'invalid-fields');
  checks++;
}
const concurrentBridge = new AgentRequestBridge();
const responses = await Promise.all(['回显 one', '长度 你好ABC', '查天气'].map((text, index) =>
  submit(concurrentBridge, `parallel-${index}`, text)));
assert.deepEqual(responses.map((result) => result.requestId), ['parallel-0', 'parallel-1', 'parallel-2']);
assert.equal(responses[0].data.text, 'one');
assert.equal(responses[1].data.length, 5);
assert.equal(responses[2].errCode, 'ERR_NO_SKILL');
checks++;
assert.equal((await submit(concurrentBridge, 'parallel-0')).errCode, 'ERR_INVALID_PARAMS');
assert.equal((await submit(new AgentRequestBridge(), 'parallel-0')).status, 'success');
checks++;
let release;
const held = new Promise((resolve) => { release = resolve; });
const delayed = new AgentRequestBridge(new AgentService({ executionPath: 'in-app', invoke: async (value) => {
  await held;
  return AppSkillService.execute(value, 'in-app');
} }));
const pending = Array.from({ length: 8 }, (_, i) => submit(delayed, `busy-${i}`));
assert.equal((await submit(delayed, 'busy-0')).errCode, 'ERR_INVALID_PARAMS',
  'Duplicate in-flight requests must not execute again.');
assert.equal((await submit(delayed, 'busy-8')).errCode, 'ERR_INVALID_PARAMS');
release();
assert.ok((await Promise.all(pending)).every((result) => result.status === 'success'));
assert.equal((await submit(delayed, 'busy-8')).status, 'success');
checks++;
const bounded = new AgentRequestBridge();
const previousBoundedLog = console.info;
try {
  console.info = () => {};
  for (let i = 0; i < 128; i++) await submit(bounded, `bounded-${i}`);
} finally { console.info = previousBoundedLog; }
assert.equal((await submit(bounded, 'bounded-128')).errCode, 'ERR_INVALID_PARAMS');
checks++;
const sent = [];
const sender = { sendData: (data) => { sent.push(JSON.parse(data)); } };
const delivery = new AgentRequestBridge();
await delivery.receive(JSON.stringify({ requestId: 'deliver', text: '回显 ok' }), sender);
assert.equal(sent.length, 1);
assert.equal(sent[0].data.text, 'ok');
delivery.close();
await delivery.receive(JSON.stringify({ requestId: 'after-close', text: '回显 x' }), sender);
assert.equal(sent.length, 1);
checks++;
let releaseLate;
const lateGate = new Promise((resolve) => { releaseLate = resolve; });
const disconnected = new AgentRequestBridge(new AgentService({ executionPath: 'in-app', invoke: async (value) => {
  await lateGate;
  return AppSkillService.execute(value, 'in-app');
} }));
const late = disconnected.receive(JSON.stringify({ requestId: 'disconnected', text: '回显 x' }), sender);
disconnected.close();
releaseLate();
await late;
assert.equal(sent.length, 1, 'Disconnected sessions must drop late responses.');
checks++;
const previousLog = console.info;
const capturedLogs = [];
try {
  console.info = (value) => { capturedLogs.push(value); };
  await new AgentRequestBridge().receive(JSON.stringify({ requestId: 'send-failed', text: '回显 private-content' }),
    { sendData: () => { throw new Error('private-transport-error'); } });
} finally { console.info = previousLog; }
assert.ok(capturedLogs.some((line) => line.includes('agent_response_send_failed') && line.includes('ERR_REPORT_FAILED')));
assert.ok(capturedLogs.every((line) => !line.includes('private-content') && !line.includes('private-transport-error')));
checks++;

console.log(`PASS: ${checks} core checks (routing, assembly, bridge validation, concurrency, delivery and late completion).`);
console.log('Node execution of pure ETS logic only. ArkTS compilation and HarmonyOS runtime remain unverified.');
