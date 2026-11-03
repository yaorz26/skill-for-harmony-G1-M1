# AgentExtensionAbility 接入位置（成员 A）

此处暂不注册或实现 `AgentExtensionAbility`，避免在未核实 SDK 回调、调用方身份和连接条件时编造一个“已接入”服务。

成员 A 在目标 DevEco/SDK 中完成：

1. 核对官方组件类型、导入路径、支持设备、版本、调用方和权限要求。
2. 提交最小扩展组件、必要资源与 `module.json5` 注册；记录实际组件回调及触发方。
3. 在回调中将数据转为 `AgentRequest`，调用 `AgentService.handle`，再按核实过的返回通道回传 `SkillResult`。
4. 区分“组件收到数据”与“意图匹配/Skill 调度成功”；分别保留连接日志和业务日志。
5. 如果目标环境不开放该组件，记录官方限制、首条错误、目标版本和替代演示入口，标记组件验证受阻。

现阶段应用页是唯一自建 Agent 输入入口，不能用 UIAbility 日志替代扩展组件回调证据。参考入口见 [接口文档](../../../../../docs/interfaces.md)。
