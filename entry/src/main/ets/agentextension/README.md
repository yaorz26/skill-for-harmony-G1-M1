# AgentExtensionAbility 入口（成员 A）

已实现并注册 `AgentExtensionAbility.ets`，使用本机 API 26 SDK 中的 `AgentExtensionAbility`、`common.AgentHostProxy`，不是 UIAbility 或普通 Service 替身。组件从 API 24 提供，系统能力为 `SystemCapability.Ability.AgentRuntime.Core`，限 Stage 模型。当前 API 26 工程已通过 ArkTS/Hvigor 编译。

## 接线

`onConnect` → 为连接建立 `AgentRequestBridge` → `onData` → JSON 校验 → `AgentService` → B 的 `IntentRouter/SkillRegistry` → 当前 `InAppSkillInvoker` → `SkillResult` → `common.AgentHostProxy.sendData()`。

请求为 JSON 字符串，例如 `{"requestId":"device-001","text":"回显 你好，鸿蒙"}`。只接受这两个字段：信封不超过 8192 个 UTF-16 码元，requestId 为 1–128 个码元且无首尾空白，text 非空且不超过 1100 个码元。非法 JSON 或不可用 ID 返回空 requestId；合法 ID 下的字段错误保留 ID。错误为统一的 `SkillResult`，不接收脚本路径或任意目标能力。

每个连接最多 8 个并行请求、128 个已接受 ID；重复 ID 只记拒绝日志，不重新执行业务、不回放旧结果，也不发送第二份同 ID 的结果。检查发生在 ID 合法后、其他字段校验前，保证重复消息中包含非法 text/额外字段时也不会抢先返回错误。额度满后重新连接；断开只停止回传，不保证取消已开始的操作。组件最多保留 8 个连接；未接纳或已关闭代理的数据返回 `ERR_NOT_CONNECTED`，不保存状态、不执行业务。连接隔离以 SDK 回调提供的 proxy 对象为键，其跨回调身份稳定性仍须目标设备实测。

桥接拒绝、发送及断开节点使用 `executionPath: agent-extension`；实际业务仍返回 `in-app`，表明没有改成真实系统 Skill 执行。业务结果返回与 `agent_response_sent`（仅指 sendData 未抛错）分别记录，不声称调用方已显示结果。

`AgentRequestBridge.receive()` 是组件回包入口，负责发送/关闭/重复 ID 抑制；`handle()` 仅用于本地自测查看处理决策，不能由组件直接调用并回传其字符串。`ERR_NOT_CONNECTED` 为 A 组件传输层错误，不改变 B 的 AgentService/Skill 业务错误契约。

## 访问与认证边界

`module.json5` 已配置 `type: agent` 与 `ohos.extension.agent → $profile:agent_config`。AgentCard 的能力描述不是应用 `skillProfiles` 的系统发现证明，也不是已实现 A2A 协议。

当前 `exported: false`，没有把未认证组件开放给其他应用。`onAuth` 只记录 `agent_auth_not_configured`，不回显握手、不调用 `authorize()` 假装认证成功。SDK 声明没有为这些回调标注权限名，但这不能推出任何应用都能连接；Want 中的 bundleName/abilityName 是目标信息，不能据此认证调用方。受支持连接 API、调用方身份/权限及握手协议目前尚未核验，不用普通 `connectServiceExtensionAbility` 或 `hdc aa start` 冒充 Agent 连接。

2026-11-08 补充核对：官方已发布 `agentManager.connectAgentExtensionAbility(want, agentId, callback)` 的**系统接口**文档，需要 `ohos.permission.CONNECT_AGENT`，列有 201（无权限）及 202（非系统应用）等错误。客户端以 `AgentProxy.sendData` 发送、`AgentExtensionConnectCallback.onData` 接收；认证载荷的具体协议仍需与真实调用方约定。本机公共 SDK 26.0.0.105 未发布这些客户端声明，在线 MateBook 的 Demo 是普通应用，尚未取得具备资格的外部调用方。上段“连接 API 尚未核验”由本次接口文档核对补充，实际 IPC、认证及回调仍未验证。来源、设备读回与 A03 固定用例见 [A 接入边界复核](../../../../../docs/records/2026-11-08-A-call-boundaries/report.md)。

## 真机后续步骤

1. 配置本地调试签名，先安装、启动页面并保存 `page_loaded` 和应用内样例结果。
2. 核实目标设备有 AgentRuntime 系统能力，取得受支持调用方的连接流程与认证约定；记录设备、版本、调用 API 和权限。确认访问控制后再单独变更导出配置。
3. 验证真实 `onConnect/onData` 和 `sendData`，用上面的固定请求，收集 `agent_connected → agent_data_received → request_received → response_returned → agent_response_sent`。
4. 验证不同连接相同 ID、同一连接重复 ID、并发、断开后迟到结果以及发送失败。页面启动、Node 测试均不能替代组件回调。
5. C 提供真实 Skill 调用适配器后由 A 注入，再由 D 验证 A02/E01；当前仍为应用内业务复用。

本次没有设备，安装、运行及系统连接均未测。完整证据见 [A 装配记录](../../../../../docs/records/2026-11-04-A-integration.md)。
