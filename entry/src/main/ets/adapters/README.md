# 调用适配层（成员 C）

`InAppSkillInvoker` 是当前唯一实现，直接调用本应用业务。后续实际 Skill 调用通过实现 `SkillInvoker` 接入，禁止把它改名后宣称完成系统调用。

系统适配器需要先核实官方可用 API、应用类型、调用方权限、目标可见性、目标 bundle/Ability/Skill 标识、参数顺序与回包方式。确认后在此目录增加实现，在 `AgentService` 注入，并将 `executionPath` 改为经验证的路径值。

`completeArkTSScriptInApp` 是 Skill 的结果上报接口，不是 Agent 发起 Skill 调用的接口。不要拼接或执行 `SKILL.md` 里的 `exec-cli` 文本充当应用调用 API。若目标 SDK 不支持本应用发起系统 Skill 调度，记录阻断，保留应用内基线。
