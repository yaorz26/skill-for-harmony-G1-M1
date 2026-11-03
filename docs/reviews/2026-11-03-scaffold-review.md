# 脚手架独立审阅（2026-11-03）

审阅由独立子代理只读执行，覆盖当前工作分支的工程组织、任务分配、需求符合性和 GitHub 提交规则。主代理处理发现的问题，子代理再次检查修改。未修改或合并其他成员的 PR。

## 结论

当前脚手架适合作为任务一的本周开发基线：Stage/ArkTS 工程有真实构建证据，应用内路由、执行器、统一返回及两个样例业务已分层。四个工作包可以基于 v0 独立开发，B/C 交付 → A 装配 → D 验收的依赖明确。

真实系统 Skill 调用、AgentExtensionAbility 入口和真机端到端仍是后续任务，不把占位或本地业务复用写成已经完成。main 已保护且有必需检查；“权限上只能自动合并”尚未实现。

## 问题与处理

| 编号 / 优先级 | 发现 | 处理与验证 | 状态 |
| --- | --- | --- | --- |
| R1 / P2 | 执行器和 AgentService 把前置、失败、超时的路径固定写为 in-app；替换适配器后会误标失败证据 | [SkillInvoker](../../entry/src/main/ets/agent/Contracts.ets)增加 executionPath，[AgentService](../../entry/src/main/ets/agent/AgentService.ets)支持注入，[SkillExecutor](../../entry/src/main/ets/runtime/SkillExecutor.ets)沿用路径；新增非 in-app 成功/失败/未命中/非法输入及超时检查 | 已修正，子代理复核通过 |
| R2 / P2 | JSON Schema maxLength 按 Unicode 码点计数，业务限制按 UTF-16 码元计数；原说明容易误认为二者完全一致 | 两份 SKILL 声明显式区分宽松 Schema 校验和入口补充校验；验证 512 个 emoji 接受、513 个拒绝 | 已修正，子代理复核通过 |
| R3 / P2 | GitHub 文档仍写 main 未保护，与当前设置不一致；曾反复强调指定审阅人 | [提交规则](../github-workflow.md)按公开 API 与截图分别记录证据；移除重复的指定审阅要求 | 已修正 |
| R4 / P2 | Allow auto-merge 不会禁止手动合并；与“技术上只能自动合并”的严格目标有差距 | 如实列为权限限制，保留 PR/检查/auto-merge 团队流程；详细保护接口需登录，未声称已逐项核验 | 待单独配置与验证 |

## 四项审阅范围

| 范围 | 审阅意见 | 证据与限制 |
| --- | --- | --- |
| 脚手架 | 模块拆分与可替换调用边界可用，未发现需阻止框架使用的已知问题 | 结构检查、23 项 Node 核心检查、Hvigor 未签名构建通过；安装/设备行为未测 |
| 分工合理性 | A 工程/装配，B 路由/契约，C Skill/适配，D 工具/验收的边界合理；D 直接维护 CI，减少等待 A 代改 | [分工与交接表](../team-plan.md)；A/C 的设备部分须尽早完成环境和 API 可行性核验 |
| 需求覆盖 | 框架、流程图、构建/运行模板、记录和设备排期均有入口；两个业务样例足以先验证基础链路 | 真实系统调度、组件回调、签名安装仍未验收，不替代任务二全部实验 |
| GitHub 设置 | API 证实 main protected=true、必需 structure、来源 Actions、检查适用 everyone | 强制 PR/最新分支/讨论解决/禁止绕过和 auto-merge 来自用户截图；详细保护 API 401；空 rulesets 与 classic 保护不冲突；不能推出严格仅自动合并 |

本轮同时保留 [PR #1](https://github.com/yaorz26/skill-for-harmony-G1-M1/pull/1)中的 B 成员认领信息（李朝阳），避免新版分工覆盖已提交的认领。该 PR 属于其他工作分支，未被本轮合并。

完整构建环境、输出与日志见 [验证记录](../records/2026-11-03-review.md)。这里的通过仅覆盖已执行的检查，不是对全部后续实现或系统运行的保证。
