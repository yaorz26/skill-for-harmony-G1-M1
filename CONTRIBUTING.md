# 协作约定

1. 在 [team-plan.md](docs/team-plan.md) 认领 A/B/C/D，补姓名和分支。分支建议：`codex/app-entry`、`codex/agent-core`、`codex/skill-runtime`、`codex/integration`。
2. 首次初始化先提交基础框架；之后从最新 `main` 建分支，经 PR 合入。至少一位其他成员审阅。不要提交 IDE 私人配置、签名材料、设备账号和构建缓存。
3. 共享接口在 `entry/src/main/ets/agent/Contracts.ets`。成员 B 维护；改变字段前先更新 `docs/interfaces.md`，并在 PR 标出受影响的调用方。
4. 各人优先改自己的目录。`module.json5` 由 A 维护，C 提供注册变更；D 汇总 README 和验收状态。出现合并冲突时由文件负责人处理。
5. PR 写清改动、实际验证、未验证项、对应记录和阻断。结构检查通过、HAP 构建成功、应用内运行、系统匹配、真实 Skill 执行、端到端通过分别记录。
6. 设备使用先填 [device-schedule.md](docs/device-schedule.md)。每次构建或实验都新增记录，原始日志经检查移除签名信息、账号和个人输入后再提交；录屏过大时提供组内可访问地址。
7. 本仓库只交付任务一及与任务二 C3 的接口证据。任务二 A/B/C/D 的完整实验由实验组负责，避免四人重复承担全部对比实验。
