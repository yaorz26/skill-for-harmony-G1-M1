# 框架阶段最终交付索引

更新：2026-11-08。原汇总工作包为成员 D；本次由 A 按用户授权统一完成 B/C/D 文档收尾，原始模块与测试记录的作者、版本和结论分别保留。

**本周“框架、Demo 工程、调度流程图、构建与运行记录”已齐备，可按该范围交付。** 本轮不追加手机实验，不以 PC 小艺成功或完整 E01 录屏为前置。自建 Agent 主动系统调用的完整目标仍未完成，不能写成全链路通过。

## 交付入口

| 组长要求 | 交付材料 | 已有结果 |
| --- | --- | --- |
| 自建 Agent 框架 | [AgentService](../entry/src/main/ets/agent/AgentService.ets)、[路由](../entry/src/main/ets/router/IntentRouter.ets)、[执行器](../entry/src/main/ets/runtime/SkillExecutor.ets)、[接口说明](interfaces.md) | 已装配 B/C，应用内接收指令、匹配能力、执行业务、返回结果及错误处理可运行 |
| Demo 工程 | 仓库根目录的 [build-profile.json5](../build-profile.json5)、[演示页](../entry/src/main/ets/pages/Index.ets)、[构建运行指南](build-and-run.md) | 完整 DevEco 工程；回显、UTF-16 长度、无匹配、无效参数和执行器自检已有运行记录 |
| 调度流程图 | [架构与调度流程](architecture.md) | 分别画出已运行的应用内路径、D 手机小艺正常路径、尚未完成的组件/系统目标路径 |
| 构建记录 | [A 本轮摘要](records/2026-11-08-A-closeout/build-summary.json)、[构建日志](records/2026-11-08-A-closeout/assemble-hap.log)、[D 构建与 IDE 同步](records/2026-11-06-D-ide-sync/report.md) | 工具版本、固定源码、构建结果和 HAP 哈希可核查 |
| 运行记录 | [A 新包名 MateBook](records/2026-11-07-A-account-bundle-device/report.md)、[D Pura 70 应用内/自检](records/2026-11-07-D-device-followup/report.md)、[D 手机系统 Skill](records/2026-11-07-D-system-skill/report.md) | PC 13 笔输入、9 项自检；手机应用内/自检及两项小艺正常调用通过，按版本分别引用 |

## 固定版本与产物

最终整合材料在 [PR #16](https://github.com/yaorz26/skill-for-harmony-G1-M1/pull/16)；交付时使用该 PR 合入 `main` 后的提交，或记录该 PR 的确切 head 提交。可用 `git rev-parse HEAD` 保存检出版本。应用实测与构建仍按下表的固定版本解释，后续文档提交不等于新设备实验。

| 用途 | 固定应用源码与环境 | 产物 SHA-256 / 证据 |
| --- | --- | --- |
| A 当前整合应用与 PC 真机 | `c7d23d7f8c669bee56b59db3b246f26e19c4e142`；包名 `com.yaorz26.g1m1.skillagent`；MateBook 14 MNTXM-24B，API 26 / 2in1 | 调试签名 HAP，162634 字节；`8BEAB624AE116B9E81A5733C3F43B92EFBFFE62F3FD88E3E55E05A423877615D`；[签名安装与运行](records/2026-11-07-A-account-bundle-device/report.md) |
| A 整合后的构建核对 | 整合提交 `d82fb10dd8cf7eb1e14daf1be6b38e52c34e5135`；DevEco 26.0.0.865 / SDK 26.0.0.105 / Hvigor 6.26.9；应用文件与上述 PC 版本一致 | 未签名 HAP，125051 字节；`15669ab6ee397844f56deac2fa4482be67954339518634129a659c3f1c6444bd`；[摘要](records/2026-11-08-A-closeout/build-summary.json)；只证明构建，不代替签名安装或新增真机测试 |
| D 已验证的手机系统调用 | `ab9691fda02a87c40cc162b166128b1a4d37aa46`；包名 `com.g1m1.skillagent`；Pura 70 / HarmonyOS 7.0.0.111 / API 26 / 小艺 11.7.8.339 | 调试签名 HAP；`AE81F666F362D7176E8390296F749EF178C6D5C0DE59B18D99FED40006DF8B20`；[安装](records/2026-11-06-D-signed-device/report.md)、[系统调用](records/2026-11-07-D-system-skill/report.md) |

签名 HAP、私钥、证书及 Profile 不在仓库共享；源码交付可复现构建，换设备安装需用匹配账号/APP ID 和设备的本机调试签名。新旧平台注册名、脚本路径及测试发布必须按[版本表](system-skill-device-runbook.md#1-先记录这一轮使用的版本)核对；D 手机成功不能写成 A 新包名 HAP 的系统调用通过。

## 最终验收范围

| 项目 | 结论 | 依据与后续条件 |
| --- | --- | --- |
| F01–F10 框架、构建、应用内运行与自检 | 对应版本已有通过证据 | [验收表](acceptance.md)逐项注明模拟器、手机、PC；F08/F09 使用测试替身，F10 为顺序请求 |
| S01/S02 小艺正常调用 | D 手机固定版本两项能力通过 | 同 requestId 的调度、脚本、上报及小艺收到结果可关联；[A 证据接收核查](records/2026-11-08-A-call-boundaries/d-evidence-review.json) |
| S02 系统无效参数分支 | 未验证，不纳入本轮追加补测 | 仅观察到“200 个字符”回复且无目标入口证据，原因未定位；[C 更正](records/2026-11-07-C-closeout-notes.md) |
| PC 小艺 | 未完成，兼容性限制归档 | 已核对发布、API/设备范围并更新客户端，仍无测试就绪入口；[PC 排查](records/2026-11-08-A-platform-config-client/report.md)；未来有受支持 PC 通道后恢复 |
| A01/A03 真实组件连接、认证、外部并发与重复请求 | 未验证，阻断归档 | 源码与本地逻辑检查已有；仍需具备资格的实际调用方、连接/认证条件；[调查与固定用例](records/2026-11-08-A-call-boundaries/report.md) |
| A02 自建 Agent 主动调用系统 Skill | 阻断，真实适配器未交付 | 已核查公共 SDK 未找到本项目可用发起接口；需平台明确接口、资格和返回协议，再由 C 适配、A 装配 |
| E01 完整目标路径与连续录屏 | 未验证，阻断归档 | 依赖上述系统条件；仓库尚无正式连续 E01 录屏，不把既有截图或两版成功片段拼成完整链路 |

完整目标的这些未验证项不会因本轮框架收尾改为通过。既有页面运行与手机小艺路径都没有证明“外部调用方 → 自建 Agent → 系统 Skill → 返回”的完整链路。

## 本轮文档收尾与审查

| 原工作包 | 已完成的文档收尾 |
| --- | --- |
| B | [接口日志章节](interfaces.md#4-日志节点)登记自检与组件事件、字段例外、源码/替身/真实设备证据边界；不改业务或公共类型 |
| C | [收口说明](records/2026-11-07-C-closeout-notes.md)更正未定位的错误参数原因，保留业务校验证据与 A02 调查范围 |
| D | 验收表、执行手册、流程图、运行指南、记录索引和本索引对齐 A 的最终成果及本轮范围 |

本次统一文档修订由 A 在本机完成，不新增或冒充 B/C/D 的设备实验。检查、审查范围与结论见[最终交付审查](reviews/2026-11-08-final-delivery-review.md)。B/C/D 上述三项没有本轮待补文档任务，剩余系统目标只在外部条件具备后恢复。

## 给任务二 C3 的交接目录

| 可复用材料 | 入口 | 使用限制 |
| --- | --- | --- |
| 固定框架、路由、业务与样例输入 | 本索引、[接口](interfaces.md)、[架构](architecture.md)、[运行指南](build-and-run.md) | 自建路由当前走应用内业务，未通过系统 Skill 发起接口 |
| PC/手机应用内及执行器自检 | [A PC 报告](records/2026-11-07-A-account-bundle-device/report.md)、[D 手机报告](records/2026-11-07-D-device-followup/report.md)、[C 模拟器报告](records/2026-11-06-C-emulator/run-report.md) | 设备、版本、路径分别引用；不能替代真实外部组件或完整 C3 |
| 小艺到应用 Skill 的系统正常路径 | [D 手机系统报告](records/2026-11-07-D-system-skill/report.md) | 可供 C2 参考；未经过自建 Agent，不能算 C3 成功 |
| 组件接口、权限和调用调查 | [A 接入边界](records/2026-11-08-A-call-boundaries/report.md)、[C API 调研](records/2026-11-05-C-runtime/api-research.md) | 含阻断条件与未来固定用例，不是执行成功报告 |

任务二完整对比实验、WebView/A2A、冷/热启动采样与性能统计由实验组负责。当前样例不单独启动业务 Ability，不虚构 Ability 生命周期；没有正式 E01 录屏或受控性能样本，`Date.now()` 关联日志不能生成性能结论。

GitHub 的 `main` 通过 PR 和必需检查更新；现有“允许 auto-merge”不等于技术上禁止手动合并，该管理限制单列在[协作规则](github-workflow.md#保护范围与限制)，本次不修改仓库权限。
