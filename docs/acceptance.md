# 验收清单

2026-11-08 框架阶段交付：工程、Demo、调度图、构建与运行记录已齐备；接收各成员已有证据，不追加手机实验。S01/S02 仅在 D 的手机历史版本上按两项正常调用范围通过；S02 错误分支、A01/A02/A03/E01 和 PC 小艺的未验证/阻断状态保留。最终版本见[交付索引](delivery-index.md)。

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
| S02 | 系统执行入口并返回（本轮两项正常调用） | system_skill_entered、业务结果、上报及最终回复证据完整 | C/D | [Pura 70 小艺真机测试](records/2026-11-07-D-system-skill/report.md)正常范围通过：均有入口、同 requestId 业务结果与上报、小艺收到结果及最终回复；无效参数系统分支仍未验证，原因未定位，不列入本轮追加补测 |
| A01 | 受支持调用方连接 AgentExtensionAbility | 真实组件回调、触发方和连接信息 | A/D | [组件与本地替身检查](records/2026-11-04-A-integration.md)已交付；[接入调查](records/2026-11-08-A-call-boundaries/report.md)确认系统接口资格要求，尚无受支持实际调用方，真实连接/认证未验证并阻断归档 |
| A02 | 自建 Agent 发起真实 Skill 调用 | 真实调用 API、目标、权限、执行与返回可关联 | A/C/D | [C 调研](records/2026-11-05-C-runtime/api-research.md)与[A SDK 复核](records/2026-11-08-A-call-boundaries/sdk-audit.json)在已核查公共 API 26 下未找到可用发起接口；真实适配器未交付，阻断归档 |
| A03 | 外部入口两次并发请求、重复 requestId | 无串包；重复请求策略明确 | A/B/C/D | 本地桥接替身检查通过；[重复策略与固定用例](records/2026-11-08-A-call-boundaries/report.md)已有，真实 IPC 未验证，依赖 A01 归档 |
| E01 | 完整目标路径从输入到回复 | 组件、意图、真实 Skill、业务/Ability、返回逐段有证据 | 全员 | 未验证，依赖 A01/A02 等条件；完整链路和连续录屏阻断归档，不作为本轮框架交付前置 |

### A 当前版 MateBook 证据补充

以上 D 的 `ab9691f` 手机/模拟器记录继续保留，不能改记为新包名的实测。本轮另接收 A 的 `c7d23d7` 应用版本：

| 范围 | 实际状态 | 证据 |
| --- | --- | --- |
| F01 构建 | DevEco 26 / SDK 26.0.0.105 未签名构建成功；本轮构建无新设备复测 | [构建摘要](records/2026-11-08-A-closeout/build-summary.json)、[日志](records/2026-11-08-A-closeout/assemble-hap.log) |
| F02 安装与页面 | 新包名签名 HAP 在 MateBook 14 / API 26 / 2in1 安装、解锁后启动及控件操作通过 | [安装与运行报告](records/2026-11-07-A-account-bundle-device/report.md) |
| F03–F07、F10 应用内 | 13 笔输入符合预期，48 条 requestId 关联事件；F10 是顺序请求 | [UI 结果](records/2026-11-07-A-account-bundle-device/ui-results.json)、[关联检查](records/2026-11-07-A-account-bundle-device/trace-checks.json) |
| F08/F09 自检 | 9 项 UI 断言通过，使用 C 的测试替身；该轮没有另存自检日志 | [自检结果](records/2026-11-07-A-account-bundle-device/selfcheck.json) |
| PC 小艺 S01/S02 | 发布与配置已核对，PC 测试就绪入口未出现，未取得真实调用证据 | [PC 配置与客户端排查](records/2026-11-08-A-platform-config-client/report.md) |

C 的[API 26 模拟器记录](records/2026-11-06-C-emulator/run-report.md)覆盖 F02–F07/F10，[自检记录](records/2026-11-06-C-selfcheck/run-report.md)覆盖 F08/F09，[F05 对齐补测](records/2026-11-06-C-f05-align/run-report.md)固定验收输入；这些是模拟器结果，不能代替真机系统调用。

F08/F09 由 C 在执行器测试中传入实现 `SkillInvoker` 的测试替身；正式样例业务没有故障开关。`tools/check-core.mjs` 的 Node 纯逻辑检查与 D 的 API 26 模拟器自检分别记录；S01 与 S02 正常分支的小艺真机系统路径另有独立证据，不代表 S02 错误分支或 A02 自建 Agent 主动调用通过。

## 交付包

- [x] 可复现的 Demo 源码版本和[构建说明](build-and-run.md)；当前 A 应用版与 D 手机基线分别固定，HAP 哈希和证据见[交付索引](delivery-index.md)。
- [x] [调度流程图](architecture.md)区分现有应用内路径、组件源码路径和待验证的系统连接。
- [x] [A 本轮构建记录](records/2026-11-08-A-closeout/build-summary.json)及[D 构建记录](records/2026-11-06-D-acceptance/report.md)含工具版本、构建摘要和产物哈希；[D IDE 同步](records/2026-11-06-D-ide-sync/report.md)单独留证。
- [x] [模拟器运行](records/2026-11-06-D-followup/report.md)、[Pura 70 应用内/自检](records/2026-11-07-D-device-followup/report.md)、[MateBook 应用内/自检](records/2026-11-07-A-account-bundle-device/report.md)及[手机小艺正常调用](records/2026-11-07-D-system-skill/report.md)已有对应版本的运行记录。
- [x] 已执行的模拟器实验按轮次保存[首轮](records/2026-11-06-D-acceptance/report.md)与[补测](records/2026-11-06-D-followup/report.md)；失败尝试和阻断状态均留痕。
- [x] [逐项状态](#验收清单)分别列出应用内、组件、系统匹配、Skill 执行与返回；未测和阻断未标通过。
- [x] [任务二 C3 交接索引](delivery-index.md#给任务二-c3-的交接目录)整理可复用框架、已有证据和阻断条件；该勾选表示材料已整理，不表示 C3 实验完成。
- [x] B 的[日志说明](interfaces.md#4-日志节点)、C 的[原因更正](records/2026-11-07-C-closeout-notes.md)、D 的验收/流程/交付索引已在本次统一收尾。

正式连续 E01 录屏尚无已归档证据，不列为本轮框架交付前置。框架最低交付已具备；完整自建 Agent 系统调用目标仍未完成。PR #16 合入后，以主线合入提交作为最终交付源码，既有实测仍绑定各自原版本。
