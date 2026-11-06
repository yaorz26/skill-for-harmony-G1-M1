# 验收清单

D 先独立准备验收步骤，收到 A 装配后的固定版本再组织整体验收；各成员提供本人模块证据。结构检查结果另记，不自动勾选运行用例。下表的“通过”均注明设备与路径；模拟器结果不代表真机系统 Skill 验收。

逐项输入、执行步骤、通过条件和证据位置见 [D 验收手册](acceptance-runbook.md)；接收版本使用[交接单](templates/acceptance-handoff.md)，失败回交使用[问题单](templates/acceptance-issue.md)。D 的当前固定版本实测见[2026-11-06 D 模拟器报告](records/2026-11-06-D-acceptance/report.md)；旧记录见[本机基线](records/2026-11-04-D-preparation/report.md)。

| ID | 路径 / 操作 | 预期结果 | 负责人 | 状态 / 证据 |
| --- | --- | --- | --- | --- |
| F01 | DevEco 同步与 assembleHap | 退出码 0，保存版本、日志、HAP 路径 | A/D | [D 在 `ab9691f` 上独立重建](records/2026-11-06-D-acceptance/report.md)：未签名 HAP 构建通过；IDE 同步未单独留证 |
| F02 | 安装及页面启动 | 演示页可操作，区分模拟器/真机 | A/D | [D 的 `ab9691f` 模拟器](records/2026-11-06-D-acceptance/report.md)安装与启动通过；真机签名安装未测 |
| F03 | `回显 你好，鸿蒙` | g1-echo，success，文本一致，in-app | B/C/D | [D 的 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)应用内路径通过 |
| F04 | `长度 你好ABC` | g1-text-length，length=5，UTF-16 单位 | B/C/D | [D 的 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)应用内路径通过 |
| F05 | `长度 😀` | length=2，避免统计口径不一致 | C/D | [D 的 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)精确输入通过；C 的 `2cde598` 记录使用 `字数 😀` |
| F06 | `查天气` | ERR_NO_SKILL，无业务执行 | B/D | [D 的 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)应用内路径通过 |
| F07 | `回显`；空输入；超过限制的输入（含 512/513 个 emoji 边界） | 空/超限返回 ERR_INVALID_PARAMS；业务入口接受 512 个 emoji，拒绝 513 个 | B/C/D | [C 在 `2cde598` 模拟器](records/2026-11-06-C-emulator/run-report.md)验证空/缺参/超限与 `字数 `+512/513 个 emoji 边界；D 未在 `ab9691f` 重跑，规范中的 `长度 `边界输入仍未测 |
| F08 | 注入抛错 SkillInvoker | ERR_INTERNAL，只有一次返回 | C/D | [D 在 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)通过自检替身验证；非正式业务或系统调用 |
| F09 | 注入超过 timeout 的异步适配器；迟到返回 | ERR_TIMEOUT；迟到结果不再次回包 | C/D | [D 在 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)通过自检替身验证；非正式业务或系统调用 |
| F10 | 连续运行两次并核对 requestId | 不同请求不串结果，链路可关联 | B/D | [C 在 `2cde598` 模拟器](records/2026-11-06-C-emulator/run-report.md)通过；D 未在 `ab9691f` 重跑 |
| S01 | 系统发现/匹配两个目标 Skill | 匹配证据指向正确名称 | A/C/D | 未测 |
| S02 | 系统执行入口并返回 | system_skill_entered、业务结果、上报及最终回复证据完整 | C/D | 未测 |
| A01 | 受支持调用方连接 AgentExtensionAbility | 真实组件回调、触发方和连接信息 | A/D | [A 组件已编译并做本地替身自测](records/2026-11-04-A-integration.md)；真实调用方/认证/设备回调未测 |
| A02 | 自建 Agent 发起真实 Skill 调用 | 真实调用 API、目标、权限、执行与返回可关联 | A/C/D | [C 的 API 26 调研](records/2026-11-05-C-runtime/api-research.md)记录公共发起接口缺失；真实适配器未交付，阻断 |
| A03 | 外部入口两次并发请求、重复 requestId | 无串包；重复请求策略明确 | A/B/C/D | [A 本地桥接替身检查](records/2026-11-04-A-integration.md)通过；真实外部入口未测 |
| E01 | 完整目标路径从输入到回复 | 组件、意图、真实 Skill、业务/Ability、返回逐段有证据 | 全员 | 未测 |

F08/F09 由 C 在执行器测试中传入实现 `SkillInvoker` 的测试替身；正式样例业务没有故障开关。`tools/check-core.mjs` 的 Node 纯逻辑检查与 D 的 API 26 模拟器自检分别记录；真机系统路径仍待验收。

## 交付包

- [ ] 可复现的 Demo 源码版本和构建说明。
- [ ] 调度流程图与实际实现一致，待验证连接明确标识。
- [ ] 构建记录含 DevEco/SDK/Hvigor/命令/日志/产物。
- [ ] 运行记录含设备、输入、预期、实际、关联日志和录屏。
- [ ] 每次设备实验一份报告；失败、超时与阻断同样保留。
- [ ] 应用内、组件、系统匹配、Skill 执行、最终返回分别报告状态。
- [ ] 任务二 C3 交接包含源码版本、输入、入口/路由/调用点/Ability/返回证据。

框架最低交付与实际系统调用阶段分别验收；没有 A02/E01 证据时，任务目标中的真实调用仍未完成。
