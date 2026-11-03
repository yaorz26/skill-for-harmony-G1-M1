# 架构与调度流程

## 1. 当前框架：应用内业务复用

```mermaid
flowchart TD
    UI["演示页输入 requestId/text"] --> Agent["AgentService 初检 (request_received)"]
    Agent -->|空请求/超长 1100| PreErr["ERR_INVALID_PARAMS"]
    Registry["SkillRegistry 应用内白名单"] --> Router["IntentRouting 路由 (默认 IntentRouter 最长前缀匹配)"]
    Agent --> Router
    Router -->|路由抛错| RouteErr["ERR_INTERNAL"]
    Router --> Match{"命中且在白名单内?"}
    Registry --> Match
    Match -->|否 intent_matched| NoSkill["ERR_NO_SKILL"]
    Match -->|是 intent_matched + trim 参数| Executor["SkillExecutor 注册/参数检查"]
    Executor --> Invoker["InAppSkillInvoker"]
    Invoker --> Service["AppSkillService 回显/长度"]
    Service --> Result["SkillResult"]
    Executor -->|缺参/超长 1024/超时/异常| ExecErr["结构化错误"]
    PreErr --> Response["关联 requestId 并返回 (response_returned)"]
    RouteErr --> Response
    NoSkill --> Response
    ExecErr --> Response
    Result --> Response
    Response --> UI
```

Agent 部分的构成：`AgentService` 通过构造函数持有 `IntentRouting`、`SkillRegistry`、`SkillInvoker` 三个可替换边界，默认分别是规则 `IntentRouter`、内置白名单、`InAppSkillInvoker`；路由异常返回 `ERR_INTERNAL`，路由器给出未注册 `skillId` 时按 `ERR_NO_SKILL` 拦截（路由不能越过白名单），组装 `SkillCall` 时统一 `trim` 参数。详见 [接口文档](interfaces.md)。

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
    Extension -.转 AgentRequest.-> Agent[AgentService 成员B]
    Agent --> Routing[应用自行路由]
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
