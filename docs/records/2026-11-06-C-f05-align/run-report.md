# 运行 / 实验报告：2026-11-06-C-f05-align-01（F05 验收口径补测）

## 1. 目标与环境

| 字段 | 实际值 |
| --- | --- |
| 用例编号 | F05（补测：输入字面与验收表对齐） |
| 背景 | [A 装配交接](../2026-11-06-A-integration.md)指出：验收表 F05 示例输入为「长度 😀」，而 [C 模拟器记录](../2026-11-06-C-emulator/run-report.md)实测输入为「字数 😀」（两者同路由 g1-text-length，但字面不一致）。本记录以与验收表**完全一致**的输入在 A 固定版本上复测。 |
| 日期 / 执行人 / 复核人 | 2026-11-06 / C 李竞宇 `lijingyuu`（子代理备环境，人工剪贴板粘贴输入） / 待 D |
| 工程版本 | **main@ab9691f（A 固定版本）**，worktree 重建：BUILD SUCCESSFUL，HAP 123267 字节，SHA-256 `F95E20013B613ED9CAE5126DE97F9288731A26BCFD171F0E3FAEE3FCFEBC32A5`（与 A 记录的 `A9550CDD…` 同提交、同大小、哈希不同——未签名 HAP 重建的打包时间戳差异，属正常；按"同提交重建"口径登记） |
| 环境 | 与 [模拟器记录](../2026-11-06-C-emulator/run-report.md) 相同（API 26 模拟器 Phone_API26，HarmonyOS 7.0.0.107）；未签名 HAP 安装成功 |
| 输入方式 | 宿主剪贴板粘贴（emoji 无法经 hdc argv 传输，见模拟器记录 §4） |
| 验证路径 | in-app |

## 2. 步骤与结果

| 输入（与验收表一致） | requestId | 预期 | 实际 | 判定 |
| --- | --- | --- | --- | --- |
| `长度 😀` | 见日志 | success / g1-text-length / length=2 | success / g1-text-length / **length=2** / 5 段 trace 完整 | ✅ |

输入框实况（粘贴后 layout 原样）：`长度 😀`，见 [layout.json](layout.json)；截图 [screen.jpeg](screen.jpeg)；日志 [g1m1.txt](g1m1.txt)（request_received → intent_matched(g1-text-length) → skill_started → skill_finished → response_returned，`executionPath="in-app"`）。

## 3. 分阶段判定

构建 ✅（同提交重建）｜安装 ✅（模拟器未签名）｜应用内运行 ✅｜组件/系统 Skill/端到端：不适用（本用例范围外）。

## 4. 结论

F05 的实测输入字面已与验收表完全一致（`长度 😀` → length=2），版本为 A 固定版本 `ab9691f`。D 登记 F05 时可引用本记录，不再存在口径差。证据哈希见 [manifest.txt](manifest.txt)。
