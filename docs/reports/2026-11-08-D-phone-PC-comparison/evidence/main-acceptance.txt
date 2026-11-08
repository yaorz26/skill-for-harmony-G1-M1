# 验收清单

D 先独立准备验收步骤，收到 A 装配后的固定版本再组织整体验收；各成员提供本人模块证据。结构检查结果另记，不自动勾选运行用例。下表的“通过”均注明设备与路径；模拟器结果不代表真机系统 Skill 验收。

逐项输入、执行步骤、通过条件和证据位置见 [D 验收手册](acceptance-runbook.md)；接收版本使用[交接单](templates/acceptance-handoff.md)，失败回交使用[问题单](templates/acceptance-issue.md)。D 的当前固定版本实测见[首轮模拟器报告](records/2026-11-06-D-acceptance/report.md)及[F07/F10 补测](records/2026-11-06-D-followup/report.md)；旧记录见[本机基线](records/2026-11-04-D-preparation/report.md)。

| ID | 路径 / 操作 | 预期结果 | 负责人 | 状态 / 证据 |
| --- | --- | --- | --- | --- |
| F01 | DevEco 同步与 assembleHap | 退出码 0，保存版本、日志、HAP 路径 | A/D | [D 在 `ab9691f` 上独立重建](records/2026-11-06-D-acceptance/report.md)未签名 HAP；[同一固定提交的 IDE 同步](records/2026-11-06-D-ide-sync/report.md)及[本机调试签名构建](records/2026-11-06-D-signed-device/report.md)通过，签名材料仅在临时工程 |
| F02 | 安装及页面启动 | 演示页可操作，区分模拟器/真机 | A/D | [D 的 `ab9691f` 模拟器](records/2026-11-06-D-acceptance/report.md)安装与启动通过；[Pura 70 真机](records/2026-11-06-D-signed-device/report.md)签名安装、Ability 启动、控件呈现及示例按钮操作通过 |
| F03 | `回显 你好，鸿蒙` | g1-echo，success，文本一致，in-app | B/C/D | [D 的 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)与[Pura 70 真机](records/2026-11-06-D-signed-device/report.md)应用内路径通过 |
| F04 | `长度 你好ABC` | g1-text-length，length=5，UTF-16 单位 | B/C/D | [D 的 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)与[Pura 70 真机](records/2026-11-06-D-signed-device/report.md)应用内路径通过 |
| F05 | `长度 😀` | length=2，避免统计口径不一致 | C/D | [D 的 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)及[Pura 70 真机](records/2026-11-07-D-device-followup/report.md)精确输入通过；[C 的同版补测](records/2026-11-06-C-f05-align/run-report.md)输入字面一致 |
| F06 | `查天气` | ERR_NO_SKILL，无业务执行 | B/D | [D 的 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)及[Pura 70 真机](records/2026-11-07-D-device-followup/report.md)应用内路径通过 |
| F07 | `回显`；空输入；超过限制的输入（含 512/513 个 emoji 边界） | 空/超限返回 ERR_INVALID_PARAMS；业务入口接受 512 个 emoji，拒绝 513 个 | B/C/D | [D 在 `ab9691f` API 26 模拟器](records/2026-11-06-D-followup/report.md)及[Pura 70 真机](records/2026-11-07-D-device-followup/report.md)验证空、纯空格、缺参、1025 参数、1101 总长与精确 `长度 `+512/513 个真 😀；应用内路径通过 |
| F08 | 注入抛错 SkillInvoker | ERR_INTERNAL，只有一次返回 | C/D | [D 在 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)及[Pura 70 真机](records/2026-11-07-D-device-followup/report.md)通过自检替身验证；非正式业务或系统调用 |
| F09 | 注入超过 timeout 的异步适配器；迟到返回 | ERR_TIMEOUT；迟到结果不再次回包 | C/D | [D 在 `ab9691f` API 26 模拟器](records/2026-11-06-D-acceptance/report.md)及[Pura 70 真机](records/2026-11-07-D-device-followup/report.md)通过自检替身验证；非正式业务或系统调用 |
| F10 | 连续运行两次并核对 requestId | 不同请求不串结果，链路可关联 | B/D | [D 在 `ab9691f` API 26 模拟器](records/2026-11-06-D-followup/report.md)及[Pura 70 真机](records/2026-11-07-D-device-followup/report.md)顺序执行 `回显 first` / `回显 second`，不同 ID、结果与各自日志对应；应用内路径通过 |
| S01 | 系统发现/匹配两个目标 Skill | 匹配证据指向正确名称 | A/C/D | [Pura 70 小艺真机测试](records/2026-11-07-D-system-skill/report.md)通过：`g1-echo`、`g1-text-length` 均有小艺 `execCli2` 点名及系统调度到对应脚本的日志；[先前初测](records/2026-11-07-D-platform/report.md)保留为失败历史 |
| S02 | 系统执行入口并返回 | system_skill_entered、业务结果、上报及最终回复证据完整 | C/D | [Pura 70 小艺真机测试](records/2026-11-07-D-system-skill/report.md)的两项正常调用通过：均有 `system_skill_entered`、同一 requestId 的业务结果与 `system_result_reported`、小艺收到结果及最终回复；验收手册要求的无效参数分支未取得系统入口证据，完整 S02 仍有一项未验证 |
| A01 | 受支持调用方连接 AgentExtensionAbility | 真实组件回调、触发方和连接信息 | A/D | [A 组件已编译并做本地替身自测](records/2026-11-04-A-integration.md)；真实调用方/认证/设备回调未测 |
| A02 | 自建 Agent 发起真实 Skill 调用 | 真实调用 API、目标、权限、执行与返回可关联 | A/C/D | [C 的 API 26 调研](records/2026-11-05-C-runtime/api-research.md)记录公共发起接口缺失；真实适配器未交付，阻断 |
| A03 | 外部入口两次并发请求、重复 requestId | 无串包；重复请求策略明确 | A/B/C/D | [A 本地桥接替身检查](records/2026-11-04-A-integration.md)通过；真实外部入口未测 |
| E01 | 完整目标路径从输入到回复 | 组件、意图、真实 Skill、业务/Ability、返回逐段有证据 | 全员 | 未测 |

F08/F09 由 C 在执行器测试中传入实现 `SkillInvoker` 的测试替身；正式样例业务没有故障开关。`tools/check-core.mjs` 的 Node 纯逻辑检查与 D 的 API 26 模拟器自检分别记录；S01 与 S02 正常分支的小艺真机系统路径另有独立证据，不代表 S02 错误分支或 A02 自建 Agent 主动调用通过。

## 交付包

- [x] 可复现的 Demo 源码版本和[构建说明](build-and-run.md)；固定构建版本与 HAP 哈希见[D 首轮报告](records/2026-11-06-D-acceptance/report.md)。
- [x] [调度流程图](architecture.md)区分现有应用内路径、组件源码路径和待验证的系统连接。
- [x] [构建记录](records/2026-11-06-D-acceptance/report.md)含 DevEco/SDK、构建命令、构建摘要与产物哈希；[IDE 同步记录](records/2026-11-06-D-ide-sync/report.md)单独留证。
- [ ] [模拟器运行记录](records/2026-11-06-D-followup/report.md)与[真机 F05–F10 记录](records/2026-11-07-D-device-followup/report.md)已有输入、结果与关联日志；真实系统路径和连续端到端录屏待补。
- [x] 已执行的模拟器实验按轮次保存[首轮](records/2026-11-06-D-acceptance/report.md)与[补测](records/2026-11-06-D-followup/report.md)；失败尝试和阻断状态均留痕。
- [x] [逐项状态](#验收清单)分别列出应用内、组件、系统匹配、Skill 执行与返回；未测和阻断未标通过。
- [ ] [任务二 C3 交接索引](delivery-index.md#给任务二-c3-的交接目录)已有现成源码/输入/路径证据；真实系统调用、Ability 生命周期和录屏证据待对应实验。

框架最低交付与实际系统调用阶段分别验收；没有 A02/E01 证据时，任务目标中的真实调用仍未完成。
