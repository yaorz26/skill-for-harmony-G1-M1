# 架构与调度流程

## 1. 当前框架：应用内业务复用

```mermaid
flowchart TD
    UI[演示页输入 requestId/text] --> Agent[AgentService 参数初检]
    Agent --> Router[IntentRouter 规则匹配]
    Registry[SkillRegistry 应用内白名单] --> Router
    Router --> Match{有匹配?}
    Match -->|否| Error[结构化错误]
    Match -->|是| Executor[SkillExecutor 注册/参数检查]
    Executor --> Invoker[InAppSkillInvoker]
    Invoker --> Service[AppSkillService 回显/长度]
    Service --> Result[SkillResult]
    Executor -->|超时/异常| Error
    Error --> Response[关联 requestId 并返回]
    Result --> Response
    Response --> UI
```

这是当前代码的实际调用关系。规则匹配由应用实现；目录由代码显式注册。调用适配器直接复用业务，没有启动一个新 Ability，也没有运行 `srcEntries` 指向的 Skill 入口。

## 2. 已放置的系统 Skill 入口源码

```mermaid
sequenceDiagram
    participant Caller as 系统调用方（待验证）
    participant Entry as EchoSkill/TextLengthSkill
    participant Business as AppSkillService
    participant Reporter as SystemSkillReporter
    Caller->>Entry: ArkTSScriptInfo + argv
    Entry->>Business: 校验并执行
    Business-->>Entry: SkillResult
    Entry->>Reporter: 统一构造 ExecuteResult
    Reporter->>Caller: completeArkTSScriptInApp
```

此图描述源码预期路径，不表示已被系统发现、匹配或执行。官方指南说明了 Skill 描述、ArkTS 入口和 `completeArkTSScriptInApp` 上报方式；系统链路需另行完成 HAP 导入及设备测试。[华为应用 Skill 开发指导](https://developer.huawei.com/consumer/cn/doc/doccenter-capabilities/arkts-skill-development-guide)

## 3. 目标链路与接口保留点

```mermaid
flowchart LR
    Client[受支持调用方] -.连接/认证待验证.-> Extension[AgentExtensionAbility 成员A]
    Extension -.转 AgentRequest.-> Agent[AgentService 成员A装配]
    Agent --> Routing[应用自行路由 成员B]
    Routing --> Executor[SkillExecutor 成员C]
    Executor -.替换 SkillInvoker.-> System[真实系统 Skill 调用适配器 待实现]
    System -.待核实调度API.-> Target[目标应用 Skill / Ability]
    Target -.结果回传.-> Extension
    Extension -.返回.-> Client
```

虚线均是待实现或待验证的连接。`AgentExtensionAbility` 只承担入口与返回通道，不假设它自动完成意图匹配；`skillProfiles` 是能力注册，不是自建 Agent 的调用 API；`completeArkTSScriptInApp` 是结果上报，不是发起调用。

保持三条路径的日志可辨识：`in-app`（现有本地适配器）、`system-skill`（系统脚本实际进入）、未来真实系统调用适配器定义的路径。扩展组件收到连接、系统匹配 Skill、业务执行、结果回传分别验收。

## 4. 和实验组的连接

任务一提供任务二 C3 的工程及逐段证据。框架暂不实现 WebView、A2A 和性能采样；若实验组复用两个样例，需要双方先固定业务和输出契约，再单独建立受控分组。`Date.now()` 日志只用于关联请求，不能据此给出 D0/D1 性能结论。
