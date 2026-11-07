# C 收口说明：S02 错误分支、A02 阻断补充、A03 策略确认（2026-11-07）

负责人：C 李竞宇 / `lijingyuu`。配合 D 的 [11-07 交付索引](../delivery-index.md)与[小艺真机验收](2026-11-07-D-system-skill/report.md)整理，供 A/D 收口引用。本文为分析确认类记录，无新实验。

## 1. S02 无效参数分支：业务侧已验证，剩余缺口在系统递参环节

- **共享业务层事实**：系统路径脚本（`EchoSkill.ets` / `TextLengthSkill.ets`）与应用内路径（`InAppSkillInvoker`）调用的是**同一个** `AppSkillService.execute`，参数校验（1–1024 个 UTF-16 码元、非全空白，否则 `ERR_INVALID_PARAMS`）在这一层完成，两条入口的拒绝行为同源。
- **同真机的应用内等价证据**：[D 真机补测](2026-11-07-D-device-followup/report.md)在同一台 Pura 70（API 26）上已验证 7 种边界输入含 `长度 `+512/513 个真 😀（513 → `ERR_INVALID_PARAMS`，3 段日志无 `skill_started`）。
- **未验证部分的精确边界**：仅剩"系统把无效参数递进脚本"一段。[D 的尝试](2026-11-07-D-system-skill/report.md)表明小艺把输入截断到约 200 字符、参数未达脚本——属调用方/平台输入限制，非应用缺陷。
- **建议登记口径**：S02 = 正常路径通过 + 错误分支阻断（平台输入限制，依据上述）。若平台日后提供可传任意参数的测试入口，复测点只有一条链：`system_skill_entered` → `ERR_INVALID_PARAMS` → `system_result_reported` → 小艺最终回复。

## 2. A02 阻断补充：execCli2 数据点

- D 的 S01 真机日志显示系统侧经 **`execCli2`** 机制点名 `g1-echo`/`g1-text-length` 并调度到对应脚本（设备 HarmonyOS `7.0.0.111`）。
- 本日复核公共 SDK `26.0.0.105`（`openharmony` + `hms` 全部 `*.d.ts` / `*.d.ets` 声明）中 `execCli*` **零匹配**：该机制不在公共 API 内，应用侧无法发起。
- 结论与 [2026-11-05 API 调研](2026-11-05-C-runtime/api-research.md)一致且更完整：**系统→应用的调度通道存在（execCli2，系统内部）；应用→系统的发起接口仍不存在**。A02 维持阻断；若后续 SDK 版本公开相关接口，按 handoff 预留的适配器方案接入。

## 3. A03 重复 requestId 策略（C 确认）

- 现行策略（A 的桥接实现 + [interfaces.md](../interfaces.md)）：每连接合法 ID 仅一次执行/结果，重复消息仅记录 `agent_duplicate_ignored` 日志；框架层"不保证相同 requestId 的重复请求幂等"。
- C 从执行器视角确认一致：`SkillExecutor` 对桥接接受的每个调用独立执行；重复 ID 在进入执行器前已被桥接拦截，不存在执行器层面的二次执行。
- A03 的剩余部分（真实外部调用方的并发/重复回调）依赖 A01 的连接条件，C 无进一步动作。

## 依据

[S01/S02 真机验收](2026-11-07-D-system-skill/report.md)、[真机 F05–F10 补测](2026-11-07-D-device-followup/report.md)、[平台导入记录](2026-11-07-D-platform/report.md)、[C API 调研](2026-11-05-C-runtime/api-research.md)、[D 交付索引](../delivery-index.md)。
