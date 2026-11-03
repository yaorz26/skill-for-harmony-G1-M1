# 接口契约 v0

源码定义：[Contracts.ets](../entry/src/main/ets/agent/Contracts.ets)。由 B 维护，A（yaorz26－姚睿哲）综合审阅。各工作包直接基于现有 v0 开发，无需等待其他成员先完成模块；接口变更先提交影响/兼容说明，经 A 审阅合入后再交接下游。

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
| `ERR_INTERNAL` | 适配器执行抛错 | 返回统一错误 |
| `ERR_REPORT_FAILED` | 系统结果上报失败 | 仅记录日志；不能宣称用户已收到结果 |

## 3. 适配器与超时

`SkillInvoker.invoke(call): Promise<SkillResult>` 是后续接真实调用的边界。当前仅 `InAppSkillInvoker`。框架超时只结束异步等待，无法中断同步阻塞代码，也不保证取消底层操作；真实适配器要处理取消、结果关联和迟到响应，不能迟到后再次给用户回包。

当前不自动重试、不保留会话，也不保证相同 `requestId` 的重复请求幂等。演示页禁用运行中的按钮；后续外部入口要验证重复请求与并发隔离。系统调用适配器须补返回校验及调用方鉴权，不能接受任意脚本路径。

## 4. 日志节点

统一前缀 `[G1M1]`，字段 `requestId/stage/skillId/executionPath/timestampMs/errCode`。

- 应用内：`request_received → intent_matched → skill_started → skill_finished → response_returned`。
- 初检或缺参失败可在执行前结束，不要求出现 `skill_started`。
- 系统脚本：`system_skill_entered → system_result_reported` 或 `system_report_failed`。
- 组件/真实调用接入后另补 `agent_connected`、`agent_data_received`、`system_call_started`、`system_call_returned`；当前没有这些事件。

`status: success` 只代表该路径的业务结果。`executionPath: in-app` 不能证明系统 Skill 执行；`system_result_reported` 也不能单独证明整个 Agent 入口链路已经完成。
