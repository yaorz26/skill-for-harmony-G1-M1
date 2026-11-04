// A 的独立装配/入口自测，复用 D 未修改的 23 项基线及其本地 ETS 加载器。
// 不属于共享 CI，也不产生设备运行证据。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
await import(pathToFileURL(resolve(root, 'tools/check-core.mjs')).href);
const load = (path) => import(pathToFileURL(resolve(root, 'entry/src/main/ets', path)).href);
const { AgentService } = await load('agent/AgentService.ets');
const { SkillRegistry } = await load('registry/SkillRegistry.ets');
const { AppSkillService } = await load('service/AppSkillService.ets');
const { AgentRequestBridge } = await load('agentextension/AgentRequestBridge.ets');
let checks = 0;

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

// 通过实际 receive/sendData 验证重复 ID 不抢占原请求，也不补发第二份终态。
let releaseOriginal;
const originalGate = new Promise((resolve) => { releaseOriginal = resolve; });
let originalExecutions = 0;
const duplicateBridge = new AgentRequestBridge(new AgentService({
  executionPath: 'in-app', invoke: async (call) => {
    originalExecutions++;
    await originalGate;
    return AppSkillService.execute(call, 'in-app');
  }
}));
const duplicateReplies = [];
const duplicateSender = { sendData: (value) => { duplicateReplies.push(JSON.parse(value)); } };
const originalMessage = JSON.stringify({ requestId: 'original', text: '回显 original-result' });
const originalPending = duplicateBridge.receive(originalMessage, duplicateSender);
await duplicateBridge.receive(originalMessage, duplicateSender);
await duplicateBridge.receive(JSON.stringify({ requestId: 'original', text: 42 }), duplicateSender);
await duplicateBridge.receive(JSON.stringify({ requestId: 'original', text: '回显 x', extra: true }), duplicateSender);
assert.equal(duplicateReplies.length, 0);
releaseOriginal();
await originalPending;
assert.equal(originalExecutions, 1);
assert.equal(duplicateReplies.length, 1);
assert.equal(duplicateReplies[0].status, 'success');
assert.equal(duplicateReplies[0].data.text, 'original-result');
await duplicateBridge.receive(originalMessage, duplicateSender);
assert.equal(duplicateReplies.length, 1, 'Completed ID duplicates must not create another terminal result.');
checks++;

// 仅替换平台基类以观察组件自身的连接容量策略；不是鸿蒙生命周期或 IPC 证据。
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '@kit.AbilityKit' && context.parentURL?.endsWith('/AgentExtensionAbility.ets')) {
    return { url: 'data:text/javascript,export class AgentExtensionAbility {} ; export const common = {}, Want = {};', shortCircuit: true };
  }
  return nextResolve(specifier, context);
} });
const { default: Extension } = await load('agentextension/AgentExtensionAbility.ets');
const extension = new Extension();
const sessions = Array.from({ length: 9 }, () => {
  const replies = [];
  return { replies, proxy: { sendData: (value) => { replies.push(JSON.parse(value)); } } };
});
const want = { bundleName: 'com.g1m1.skillagent', abilityName: 'AgentExtensionAbility' };
for (const session of sessions) extension.onConnect(want, session.proxy);
extension.onData(sessions[8].proxy, JSON.stringify({ requestId: 'ninth', text: '回显 x' }));
assert.equal(sessions[8].replies.length, 1);
assert.equal(sessions[8].replies[0].errCode, 'ERR_NOT_CONNECTED');
assert.equal(sessions[8].replies[0].requestId, 'ninth');
assert.equal(sessions[8].replies[0].executionPath, 'agent-extension');
checks++;
extension.onDisconnect(want, sessions[0].proxy);
extension.onConnect(want, sessions[8].proxy);
extension.onData(sessions[8].proxy, JSON.stringify({ requestId: 'accepted-after-disconnect', text: '回显 accepted' }));
// 本地纯逻辑队列，不等待真实设备或 IPC。
await new Promise((resolve) => setImmediate(resolve));
assert.equal(sessions[8].replies.length, 2);
assert.equal(sessions[8].replies[1].data.text, 'accepted');
extension.onDestroy();
extension.onData(sessions[8].proxy, '{');
assert.equal(sessions[8].replies.length, 3);
assert.equal(sessions[8].replies[2].requestId, '');
assert.equal(sessions[8].replies[2].errCode, 'ERR_NOT_CONNECTED');
checks++;
assert.doesNotThrow(() => AgentRequestBridge.rejectUnconnected('x'.repeat(8193), {
  sendData: () => { throw new Error('transport failed'); }
}));
checks++;

const config = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const module = config('entry/src/main/module.json5').module;
const agentExtension = module.extensionAbilities.find((item) => item.type === 'agent');
assert.equal(agentExtension.exported, false);
assert.equal(agentExtension.metadata[0].name, 'ohos.extension.agent');
assert.equal(agentExtension.metadata[0].resource, '$profile:agent_config');
const card = config('entry/src/main/resources/base/profile/agent_config.json').agentCards[0];
assert.equal(card.appInfo.bundleName, config('AppScope/app.json5').app.bundleName);
assert.equal(card.appInfo.moduleName, module.name);
assert.equal(card.appInfo.abilityName, agentExtension.name);
assert.deepEqual(card.skills.map((item) => item.id).sort(), module.skillProfiles.map((item) => item.name).sort());
checks++;

console.log(`PASS: ${checks} A entry/assembly checks in addition to the unchanged 23 shared core checks.`);
console.log('Local ETS logic and platform-base stub only. No device callbacks, IPC, authentication or system Skill execution verified.');
