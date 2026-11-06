# 2026-11-06 A 装配与验收交接

## 固定版本

本轮以已合入 PR #7、PR #8 的 `main@3d89c6bdf0ff0595f8a28bd39cb966013a08ca63` 为整合基线。在 A 的组件回包适配器中显式处理 `AgentHostProxy.sendData()` 可能抛出的异常：保留 `Error` 并向桥接层传播，非 `Error` 异常包装为通用 `Error`，由 `AgentRequestBridge` 统一记录发送失败。

装配后的主路径为：`AgentExtensionAbility` → `AgentRequestBridge` → `AgentService` → B 的 `IntentRouter` / `SkillRegistry` → C 的 `SkillExecutor` / `InAppSkillInvoker` → 两个应用内 Skill → `AgentHostProxy.sendData()`。`module.json5` 中的 Agent Extension、AgentCard 与 Skill profiles 已在基线配置中，无需另改注册项。

PR #8 的 F08/F09 按钮调用独立的 `ExecutorSelfCheck`，仅构造测试替身验证异常、超时和迟到结果；正式 `AgentService`、应用内 Skill 及其执行开关未被测试替身污染。C 对 API 26 公共 API 的调研没有发现应用发起系统 Skill 调度的接口，所以当前正式 invoker 仍明确标记 `in-app`，没有增加或伪装系统调用适配器。

## 构建和检查

| 项目 | 结果 |
| --- | --- |
| DevEco Studio / SDK | 26.0.0.865（Build 261.23567.138.36.2600865）/ HarmonyOS SDK 26.0.0.105，API 26 |
| 构建命令 | `./tools/build-hap.ps1 -DevEcoRoot 'D:\yaorz\tools\DevEco Studio'` |
| 构建结果 | `assembleHap` 成功，5.457 秒，33 项任务（17 executed / 16 up-to-date）；无 ArkTS 编译警告 |
| HAP | `entry/build/default/outputs/default/entry-default-unsigned.hap`，123267 bytes，SHA-256 `A9550CDD2270CCF00A00459388AEC757802E288265DE3ADA2E39D28C1B629EBF` |
| 结构检查 | `node tools/check-structure.mjs`：157 files、2 个 Skill profiles，通过 |
| Agent 入口检查 | `node docs/records/2026-11-04-A-integration/check-entry.mjs`：A 32 项 + 共享核心 23 项，通过；平台基类使用本地替身 |
| 执行器检查 | `node docs/records/2026-11-05-C-runtime/check-executor.mjs`：18 项通过（Node 逻辑） |
| 设备 | HDC 返回 `[Empty]`；本轮没有安装、页面运行或组件回调验证 |

构建产物未签名，构建通过不代表已经可在真机安装或通过系统调用。

## C 的运行记录与版本边界

- [C 模拟器记录](2026-11-06-C-emulator/run-report.md)在 `main@2cde598` 的 API 26 模拟器上验证 F02–F07、F10 的应用内路径：13 个输入变体通过，含 512/513 真 emoji 边界与两次请求不串包；这是模拟器证据，不是真机证据。该报告早于 PR #8 和本轮 A 回包异常处理调整，不能称作本轮 HAP 的重跑结果。
- [C 自检记录](2026-11-06-C-selfcheck/run-report.md)在 `codex/member-c-selfcheck@e6ad4c7` 的 API 26 模拟器上验证 F08/F09：9/9 项通过。PR #8 将该自检代码和页面入口合入当前 `main`；本轮只在当前源码上重新构建，没有重跑模拟器。
- `self_check_started` / `self_check_finished` 是新增日志节点，沿用现有 TraceReporter 格式；请 B 决定是否更新 `docs/interfaces.md` 的节点清单。

## 给 D 的验收交接

请 D 独立维护 [验收表](../acceptance.md)，依据上述 C 的原始记录更新相应行，并保留版本/设备口径：

- F02–F07、F10 可登记为“API 26 模拟器通过（非真机）”，证据指向 C 模拟器报告及其逐用例日志；标明实测源码版本 `2cde598`，不要写成本轮 `3d89c6b` 的模拟器复测。
- F08/F09 可登记为“鸿蒙运行时自检通过（API 26 模拟器）”，证据指向 C 自检报告；标明 C 的测试版本 `e6ad4c7`，且该路径是注入替身自检，不是系统 Skill 调用。
- F05 验收表当前示例写作“长度 😀”，C 的实测输入记作“字数 😀”；请确认验收口径或补齐完全一致的输入记录后再标记该具体样例。
- A01/A03 的本地替身测试不等于真实组件回调；S01/S02 仍需系统 Agent 入口与真机。A02 受 API 26 未发现应用发起公共接口的限制，维持阻断调查，不得用应用内路径代替。
- F01 当前源码有未签名 HAP 构建记录；D 对固定版本复核 IDE 同步/构建后再按其流程记录。

当前完成的是工程装配、编译与本地模块检查。真实 Agent Extension 回调、系统发现/执行、签名安装和端到端真机路径仍未完成。
