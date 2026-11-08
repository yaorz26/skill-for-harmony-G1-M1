# C 收口说明：S02 错误分支、A02 阻断补充、A03 策略确认（2026-11-07）

负责人：C 李竞宇 / `lijingyuu`。配合 D 的 [11-07 交付索引](../delivery-index.md)与[小艺真机验收](2026-11-07-D-system-skill/report.md)整理，供 A/D 收口引用。本文为分析确认类记录，无新实验。

2026-11-08 交付前修正：按现有原始证据限定 S02 失败原因，并同步已确认的正常调用验收范围。此次为文档更正，没有新增实验；原始尝试报告及日志保留。

## 1. S02 无效参数分支：应用内边界已验证，系统错误链未验证

- **源码复用关系**：系统路径脚本（`EchoSkill.ets` / `TextLengthSkill.ets`）与应用内路径（`InAppSkillInvoker`）调用的是**同一个** `AppSkillService.execute`，该函数也实现参数校验（1–1024 个 UTF-16 码元、非全空白，否则 `ERR_INVALID_PARAMS`）。应用内路径另有前置检查，源码复用不能说明两条路径的错误请求都执行过该函数。
- **同真机的应用内边界证据**：[D 真机补测](2026-11-07-D-device-followup/report.md)在同一台 Pura 70（API 26）上已验证 7 种边界输入含 `长度 `+512/513 个真 😀（513 → `ERR_INVALID_PARAMS`，3 段日志无 `skill_started`）。这些无效输入在页面链路的 AgentService/IntentRouter/SkillExecutor 前置检查处返回，不能说真机已执行到 AppSkillService 的错误分支，更不能替代系统入口对无效参数的解析及返回验证。
- **主机业务函数检查**：[共享核心检查](../../tools/check-core.mjs)直接调用 AppSkillService 检查 512/513 个 emoji 的接受与拒绝；本轮主机检查通过。这是 Node 纯逻辑证据，不是系统脚本错误分支的真机证据。
- **未验证部分的精确边界**：[D 的尝试](2026-11-07-D-system-skill/report.md)只观察到小艺按“200 个字符”作答，同轮未取得目标调度、脚本入口或错误上报的关联证据。无法确定是否发生输入截断，也无法区分模型处理、参数传递或其他环节；原因未定位，不能归因为平台输入限制，亦不能据此排除应用入口问题。
- **最终登记口径**：S01/S02 正常调用在 D 的手机固定版本通过；S02 无效参数系统分支未验证，按已确认范围不列入本轮追加补测。未来获得正式递参入口后，再验证完整错误链：`system_skill_entered` → `ERR_INVALID_PARAMS` → `system_result_reported` → 小艺最终回复。

## 2. A02 阻断补充：execCli2 数据点

- D 的 S01 真机日志显示系统侧经 **`execCli2`** 机制点名 `g1-echo`/`g1-text-length` 并调度到对应脚本（设备 HarmonyOS `7.0.0.111`）。
- 本日复核公共 SDK `26.0.0.105`（`openharmony` + `hms` 全部 `*.d.ts` / `*.d.ets` 声明）中 `execCli*` **零匹配**：未找到可供本项目普通应用使用的公共发起声明，不能把日志里的内部命令直接当作应用 API。
- 结论与 [2026-11-05 API 调研](2026-11-05-C-runtime/api-research.md)一致：系统到应用的调度通道已有手机证据；在已核查的公共 SDK 和当前调用资格下，尚未取得自建 Agent 主动发起调用的可用接口。A02 维持阻断；未来取得受支持接口、调用资格及返回协议后，按 handoff 预留的适配器方案接入。

## 3. A03 重复 requestId 策略（C 确认）

- 现行策略（A 的桥接实现 + [interfaces.md](../interfaces.md)）：每连接已接受的合法 ID 仅一次执行及结果发送尝试，重复消息仅记录 `agent_duplicate_ignored` 日志；不提供结果重放或跨连接幂等保证。
- C 从执行器视角确认一致：`SkillExecutor` 对桥接接受的每个调用独立执行；重复 ID 在进入执行器前已被桥接拦截，不存在执行器层面的二次执行。
- A03 的剩余部分（真实外部调用方的并发/重复回调）依赖 A01 的连接条件，C 无进一步动作。

## 依据

[S01/S02 真机验收](2026-11-07-D-system-skill/report.md)、[真机 F05–F10 补测](2026-11-07-D-device-followup/report.md)、[平台导入记录](2026-11-07-D-platform/report.md)、[C API 调研](2026-11-05-C-runtime/api-research.md)、[D 交付索引](../delivery-index.md)。
