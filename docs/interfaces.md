# 接口契约 v0

源码定义：[Contracts.ets](../entry/src/main/ets/agent/Contracts.ets)。由 B 维护。各工作包直接基于现有 v0 开发；接口变更先通过 PR 提交影响和兼容说明，合入后再交接下游。

## 1. 输入与路由

```json
{ "requestId": "ui-001", "text": "回显 你好，鸿蒙" }
```

`requestId` 为非空字符串，由入口产生且一次请求内不变；页面使用时间戳加递增序号。系统脚本入口用 `info.requestCode` 关联系统请求。`text` 非空，最长 1100 个 UTF-16 码元。

| 前缀（区分大小写） | skillId | 实际参数 |
| --- | --- | --- |
| `回显` / `echo` | `g1-echo` | 前缀后去掉首尾空白的文本 |
| `长度` / `字数` / `length` | `g1-text-length` | 前缀后去掉首尾空白的文本 |

前缀与文本之间至少一个普通空格；暂不支持无空格、制表符分隔或任意自然语言语义匹配。纯前缀进入缺参错误；未知前缀返回 `ERR_NO_SKILL`。参数限制为 1–1024 个 UTF-16 码元且不能全为空白。

路由与参数规则（`IntentRouter`，用例见 [B 路由验证](records/2026-11-03-B-routing.md)）：

- 先对整条输入去掉首尾空白，再匹配；前缀**区分大小写**（`Echo x`、`ECHO x` 均为 `ERR_NO_SKILL`）。
- 分隔符只认普通空格 U+0020：制表符、全角空格 U+3000 或无空格（`回显你好`）不匹配；前缀必须整词命中，`echoes x`、`回显长度 abc` 同样不匹配。
- 参数 = 前缀之后的文本去掉首尾空白；参数内部的空格和关键字原样保留，不会二次路由（`回显 长度 abc` → `g1-echo`，参数 `长度 abc`）。
- 多个前缀同时命中时取最长前缀；同一输入、同一目录永远得到同一个 Skill。目录在构造时校验：`id` 为小写连字符格式且唯一、`name` 非空、前缀无首尾或非法空白（制表符/换行/全角空格）且全局唯一，否则抛错而不是静默覆盖。
- 路由只产出 `IntentDecision`，不执行能力；另提供 `IntentRouter.evaluate(request, skills, supportedHint?)` 在不依赖执行器的前提下独立判定初检、白名单复核与参数长度边界。

| 输入 | 结果 |
| --- | --- |
| `回显 你好，鸿蒙` / `echo hello` | `g1-echo`，参数去掉前缀和首尾空白 |
| `长度 你好ABC` / `字数 你好` / `length abc` | `g1-text-length` |
| `回显`、`回显   ` | 命中 `g1-echo`，参数为空 → `ERR_INVALID_PARAMS` |
| `回显 ` + 1025 个字符 | 命中后参数超长 → `ERR_INVALID_PARAMS`（`skillId` 保留） |
| 整条输入超过 1100 个码元或为空白 | 入口初检 `ERR_INVALID_PARAMS`，`skillId` 为空 |
| 未知前缀、大小写不符、分隔符不符 | `ERR_NO_SKILL`，不执行业务 |

## 2. 调用与返回

```json
{ "requestId": "ui-001", "skillId": "g1-echo", "argument": "你好，鸿蒙" }
```

```json
{
  "requestId": "ui-001",
  "skillId": "g1-echo",
  "status": "success",
  "data": { "text": "你好，鸿蒙" },
  "errCode": "",
  "errMsg": "",
  "executionPath": "in-app"
}
```

长度能力 `data` 包含 `text`、`length` 和 `unit: "utf16-code-unit"`。例如“你好ABC”为 5；emoji“😀”为 2，不把 String.length 解释成字素数。应用内路由会 trim 参数，系统入口保留传入的非空文本；比较业务性能时直接固定相同业务参数，不能比较不同的预处理负载。

失败也返回相同的外壳：`status: failed`，`data: {}`，错误码和非空 `errMsg`。`skillId` 在尚未匹配时为空。日志只包含关联信息，不默认打印用户全文。

| 错误码 | 场景 | 本周要求 |
| --- | --- | --- |
| `ERR_INVALID_PARAMS` | 空请求、缺参、超长或全空白 | 返回错误并停止业务 |
| `ERR_NO_SKILL` | 未知意图或未注册能力 | 返回支持的指令提示 |
| `ERR_TIMEOUT` | 执行等待超过默认 3000 ms | 一次返回；不自动重试 |
| `ERR_INTERNAL` | 路由或适配器执行抛错 | 返回统一错误 |
| `ERR_REPORT_FAILED` | 系统结果上报失败 | 仅记录日志；不能宣称用户已收到结果 |

## 3. 适配器与超时

`SkillInvoker` 包含 `executionPath: string` 与 `invoke(call): Promise<SkillResult>`，是后续接真实调用的边界。通过 `new AgentService(invoker)` 注入适配器；前置日志、失败和超时使用该适配器声明的路径，返回值也应保持一致。当前默认仅 `InAppSkillInvoker`，不能用测试路径当作系统调用证据。框架超时只结束异步等待，无法中断同步阻塞代码，也不保证取消底层操作；真实适配器要处理取消、结果关联和迟到响应，不能迟到后再次给用户回包。

当前不自动重试、不保留会话，也不保证相同 `requestId` 的重复请求幂等。演示页禁用运行中的按钮；后续外部入口要验证重复请求与并发隔离。系统调用适配器须补返回校验及调用方鉴权，不能接受任意脚本路径。

## 3.1 路由与目录装配契约（由 B 交付 A）

B 模块对现有 `AgentService` 保持 **100% 向后兼容**（无需改动 `AgentService.ets` 即可直接使用）：

| 模块 / 接口 | 签名与职责 | 兼容性与说明 |
| --- | --- | --- |
| `IntentRouter` | `route(text, skills): IntentDecision`、`match(text, skills)`、`evaluate(request, skills, hint?)` | 同步 `route` 与现有 `AgentService` 直接兼容；同时实现 `AsyncIntentRouting.routeAsync` 预留异步替换 |
| `SkillRegistry` | `new SkillRegistry(descriptors?)`、`list()`、`get(id)`、`contains(id)`、`supportedHint()` | 默认注册 `g1-echo` 与 `g1-text-length`；所有读取接口返回防御性深拷贝 |
| `IntentRouting` / `AsyncIntentRouting` | 新增于 `Contracts.ets` 的可选契约接口 | 纯增量类型定义，不破坏 C 的 `SkillInvoker` 或 A 的 `AgentService` |

成员 A 在装配阶段可直接保留 `new SkillRegistry()` 与 `new IntentRouter()` 默认接线；如需自定义白名单或动态提示文本，可调用 `registry.supportedHint()` 或 `router.evaluate(request, registry.list(), registry.supportedHint())`。与建仓前本地 `HarmonyAgent` 工程的边界：B 模块仅吸收其目录严格校验、防御性副本与路由端口解耦，保持零 `@kit` 平台依赖，不迁入云端模型网络请求、会话与工具执行循环。

## 4. 日志节点

统一前缀 `[G1M1]`，字段 `requestId/stage/skillId/executionPath/timestampMs/errCode`。

- 应用内：`request_received → intent_matched → skill_started → skill_finished → response_returned`。未命中时 `intent_matched` 的 `errCode` 为 `ERR_NO_SKILL`、`skillId` 为空，随后直接 `response_returned`。
- 初检或缺参失败可在执行前结束，不要求出现 `skill_started`。
- 系统脚本：`system_skill_entered → system_result_reported` 或 `system_report_failed`。
- 组件/真实调用接入后另补 `agent_connected`、`agent_data_received`、`system_call_started`、`system_call_returned`；当前没有这些事件。

`status: success` 只代表该路径的业务结果。`executionPath: in-app` 不能证明系统 Skill 执行；`system_result_reported` 也不能单独证明整个 Agent 入口链路已经完成。
