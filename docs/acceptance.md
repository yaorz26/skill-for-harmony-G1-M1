# 验收清单

D 先独立准备验收步骤，收到 A 装配后的固定版本再组织整体验收；各成员提供本人模块证据。初始状态统一为“未测”；结构检查结果另记，不自动勾选下列用例。

逐项输入、执行步骤、通过条件和证据位置见 [D 验收手册](acceptance-runbook.md)；接收版本使用[交接单](templates/acceptance-handoff.md)，失败回交使用[问题单](templates/acceptance-issue.md)。D 的本机基线证据见[本轮记录](records/2026-11-04-D-preparation/report.md)，不覆盖下面的鸿蒙运行时状态。

| ID | 路径 / 操作 | 预期结果 | 负责人 | 状态 / 证据 |
| --- | --- | --- | --- | --- |
| F01 | DevEco 同步与 assembleHap | 退出码 0，保存版本、日志、HAP 路径 | A/D | D 的旧基线、[A 装配版](records/2026-11-04-A-integration.md)及[C 当前版](records/2026-11-05-C-runtime/build-record.md)均有未签名构建记录；D 尚未对最终固定版本复核 IDE 同步/构建 |
| F02 | 安装及页面启动 | 演示页可操作，区分模拟器/真机 | A/D | 未测 |
| F03 | `回显 你好，鸿蒙` | g1-echo，success，文本一致，in-app | B/C/D | 未测 |
| F04 | `长度 你好ABC` | g1-text-length，length=5，UTF-16 单位 | B/C/D | 未测 |
| F05 | `长度 😀` | length=2，避免统计口径不一致 | C/D | 未测 |
| F06 | `查天气` | ERR_NO_SKILL，无业务执行 | B/D | 未测 |
| F07 | `回显`；空输入；超过限制的输入（含 512/513 个 emoji 边界） | 空/超限返回 ERR_INVALID_PARAMS；业务入口接受 512 个 emoji，拒绝 513 个 | B/C/D | Node 纯逻辑通过；鸿蒙运行时未测 |
| F08 | 注入抛错 SkillInvoker | ERR_INTERNAL，只有一次返回 | C/D | [C 的 Node 替身检查](records/2026-11-05-C-runtime/handoff.md)通过；鸿蒙运行时未测 |
| F09 | 注入超过 timeout 的异步适配器；迟到返回 | ERR_TIMEOUT；迟到结果不再次回包 | C/D | [C 的 Node 替身检查](records/2026-11-05-C-runtime/handoff.md)通过；鸿蒙运行时未测 |
| F10 | 连续运行两次并核对 requestId | 不同请求不串结果，链路可关联 | B/D | 未测 |
| S01 | 系统发现/匹配两个目标 Skill | 匹配证据指向正确名称 | A/C/D | 未测 |
| S02 | 系统执行入口并返回 | system_skill_entered、业务结果、上报及最终回复证据完整 | C/D | 未测 |
| A01 | 受支持调用方连接 AgentExtensionAbility | 真实组件回调、触发方和连接信息 | A/D | [A 组件已编译并做本地替身自测](records/2026-11-04-A-integration.md)；真实调用方/认证/设备回调未测 |
| A02 | 自建 Agent 发起真实 Skill 调用 | 真实调用 API、目标、权限、执行与返回可关联 | A/C/D | [C 的 API 26 调研](records/2026-11-05-C-runtime/api-research.md)记录公共发起接口缺失；真实适配器未交付，阻断 |
| A03 | 外部入口两次并发请求、重复 requestId | 无串包；重复请求策略明确 | A/B/C/D | [A 本地桥接替身检查](records/2026-11-04-A-integration.md)通过；真实外部入口未测 |
| E01 | 完整目标路径从输入到回复 | 组件、意图、真实 Skill、业务/Ability、返回逐段有证据 | 全员 | 未测 |

F08/F09 由 C 在执行器测试中传入实现 `SkillInvoker` 的测试替身；不要在正式样例业务中留下故障开关。`tools/check-core.mjs` 已提供 Node 环境的纯逻辑注入检查，但上述状态仍需 D 在目标鸿蒙运行时验证后更新。

## 交付包

- [ ] 可复现的 Demo 源码版本和构建说明。
- [ ] 调度流程图与实际实现一致，待验证连接明确标识。
- [ ] 构建记录含 DevEco/SDK/Hvigor/命令/日志/产物。
- [ ] 运行记录含设备、输入、预期、实际、关联日志和录屏。
- [ ] 每次设备实验一份报告；失败、超时与阻断同样保留。
- [ ] 应用内、组件、系统匹配、Skill 执行、最终返回分别报告状态。
- [ ] 任务二 C3 交接包含源码版本、输入、入口/路由/调用点/Ability/返回证据。

框架最低交付与实际系统调用阶段分别验收；没有 A02/E01 证据时，任务目标中的真实调用仍未完成。
