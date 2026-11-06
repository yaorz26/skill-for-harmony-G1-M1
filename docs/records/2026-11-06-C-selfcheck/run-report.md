# 运行 / 实验报告：2026-11-06-C-selfcheck-01（F08/F09 鸿蒙运行时）

## 1. 目标与环境

| 字段 | 实际值 |
| --- | --- |
| 用例编号 | F08、F09（执行器容错，鸿蒙运行时栏） |
| 日期 / 执行人 / 复核人 | 2026-11-06 / C 李竞宇 `lijingyuu`（子代理执行、主会话复核证据） / 待 D |
| 工程分支 / commit / HAP | `codex/member-c-selfcheck`@`e6ad4c7`；HAP 122987 字节，SHA256 `EA39D12F9F7097A5D3D308F0DC2777E7D30E7D85C05318D7527ED90FDC6A033A` |
| 环境 | 与 [模拟器记录](../2026-11-06-C-emulator/run-report.md) 相同（API 26 模拟器 `Phone_API26`，HarmonyOS 7.0.0.107）；未签名 HAP 安装成功 |
| 测试入口 | 演示页新增「执行器自检 F08/F09」按钮 → `ExecutorSelfCheck.run()`：运行时构造独立 `SkillExecutor`，注入 `FaultyInvoker`（同步抛错）与 `SlowInvoker`（200ms 完成，执行器超时 50ms）测试替身，另含正常对照组。替身仅存在于 [ExecutorSelfCheck.ets](../../../entry/src/main/ets/runtime/ExecutorSelfCheck.ets)，`AppSkillService` / `InAppSkillInvoker` 零改动、无故障开关 |
| 验证路径 | self-check（测试路径，不冒充任何系统调用；正式业务路径仍为 in-app） |

## 2. 步骤与结果（设备运行时，requestId `self-check-1793938261897`）

| # | 判定项 | 预期 | 实际 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | F08 errCode | ERR_INTERNAL | ERR_INTERNAL | ✅ |
| 2 | F08 适配器调用次数 | 恰好 1 | 1 | ✅ |
| 3 | F08 保留替身 executionPath | self-check-fault | self-check-fault | ✅ |
| 4 | F09 errCode | ERR_TIMEOUT | ERR_TIMEOUT | ✅ |
| 5 | F09 提前返回 | <150ms | 58ms | ✅ |
| 6 | F09 迟到结果不改写返回值 | 仍 ERR_TIMEOUT | 仍 ERR_TIMEOUT | ✅ |
| 7 | F09 迟到后不重试 | 调用 1 次 | 1 | ✅ |
| 8 | F09 底层照常完成（不宣称取消） | completed=1 | 1 | ✅ |
| 9 | 对照组（正常适配器经执行器） | success | success | ✅ |

`allPassed = true`。页面输出原样见 [selfcheck-summary.json](selfcheck-summary.json) 与 [selfcheck-after.json](selfcheck-after.json)，截图 [selfcheck.jpeg](selfcheck.jpeg)。

关键日志（完整 8 行见 [hilog-selfcheck.log](hilog-selfcheck.log)）：同 requestId 下 `self_check_started` → F08 `skill_finished(ERR_INTERNAL)` → F09 `skill_finished(ERR_TIMEOUT)` → 对照组 `skill_finished()` → `self_check_finished`（无错误码），全程 `executionPath="self-check"`。

## 3. 分阶段判定

| 阶段 | 判定 | 说明 |
| --- | --- | --- |
| 构建 | 通过 | 150 文件结构检查、28 项核心检查、assembleHap 成功（worktree `e6ad4c7`） |
| 安装 | 通过 | 未签名 HAP 模拟器安装成功 |
| 应用内运行 | 通过 | 9/9 项，无崩溃 |
| F08（鸿蒙运行时） | **通过** | 与 [Node 18 项检查](../2026-11-05-C-runtime/check-executor.mjs) 结论一致 |
| F09（鸿蒙运行时） | **通过** | 同上；迟到隔离在目标运行时同样成立 |
| 系统 Skill / 组件 | 不适用 | 本用例不涉及；S01/S02/A01 仍待真机 |

## 4. 结论与交接

1. **F08/F09 在鸿蒙运行时通过**，与 Node 纯逻辑结论互相印证。D 可将验收表 F08/F09 的"鸿蒙运行时"栏按本记录更新（此前为"阻断（无测试入口）"）。
2. 新增日志节点 `self_check_started` / `self_check_finished`（executionPath=`self-check`），沿用 TraceReporter 既有格式；建议 B 评估是否纳入 interfaces.md §4 节点清单（本轮未改该文档）。
3. `pages/Index.ets`（A 维护）的 diff 为三处最小改动（import、`selfCheck()`、一个按钮），**请 A 复核**；如需调整位置/文案，C 配合。
4. 复现：合并后在新 HAP 安装 → 演示页点「执行器自检 F08/F09」→ 输出区显示 9 项判定；日志 `hdc shell hilog -x` 过滤 `[G1M1]`。

证据哈希见 [manifest.txt](manifest.txt)。
