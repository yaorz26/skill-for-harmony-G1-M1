# 调用适配层（成员 C）

`InAppSkillInvoker` 是当前唯一实现，直接调用本应用业务。后续实际 Skill 调用通过实现 `SkillInvoker` 接入，禁止把它改名后宣称完成系统调用。

系统适配器需要先核实官方可用 API、应用类型、调用方权限、目标可见性、目标 bundle/Ability/Skill 标识、参数顺序与回包方式。确认后在此目录增加实现，在 `AgentService` 注入，并将 `executionPath` 改为经验证的路径值。

`completeArkTSScriptInApp` 是 Skill 的结果上报接口，不是 Agent 发起 Skill 调用的接口。不要拼接或执行 `SKILL.md` 里的 `exec-cli` 文本充当应用调用 API。若目标 SDK 不支持本应用发起系统 Skill 调度，记录阻断，保留应用内基线。

## 2026-11-05 API 26 核实

在 DevEco 26.0.0.865 / SDK 26.0.0.105 的公共声明中：

- `@ohos.bundle.skillManager` 仅提供 Skill 查询（`getSkillInfo*`）；跨应用查询需要系统级 `MANAGE_SKILL_PRIVILEGE` 或 `MANAGE_SKILL` 权限。
- `@ohos.app.ability.scriptManager` 仅提供 `completeArkTSScriptInApp` 结果上报。
- `AgentExtensionAbility` / `AgentHostProxy` 是被连接方的生命周期与回发通道，不能发起调用。
- HMS `@hms.ai.AgentFramework` 是打开小艺入口的 UI 组件，`FunctionController` 注释为 reserved。

未发现 `executeSkill`、`invokeSkill`、`startSkill`、`callSkill` 或 `SkillInvoker` 公共 API。因此本轮不新增“真实调用”适配器，A02 记录阻断；`InAppSkillInvoker` 仍是唯一实现。证据见 [API 调研](../../../../../docs/records/2026-11-05-C-runtime/api-research.md)。
