# G1-M1：可调用应用 Skill 的自建 Agent

四人共同完成任务一：先交付可继续开发的鸿蒙 Agent 框架，再在真机上验证应用 Skill 调用。框架交付截止 **2026-11-09（周一）**。**成员 A：yaorz26－姚睿哲，负责工程入口、最终整合及综合审阅**；B/C/D 在[四人分工](docs/team-plan.md)中认领，不安排交叉审阅。

## 先看这些

- [四人分工与每日里程碑](docs/team-plan.md)
- [独立开发与交接顺序](docs/team-plan.md#7-必需依赖与先后顺序)、[PR 与自动合并规则](docs/github-workflow.md)
- [调度流程与当前实现边界](docs/architecture.md)
- [接口、输入输出与错误码](docs/interfaces.md)
- [构建与运行](docs/build-and-run.md)
- [验收用例](docs/acceptance.md)、[构建与运行记录](docs/records/README.md)
- [文档索引](docs/README.md)、[协作约定](CONTRIBUTING.md)

## 当前框架

采用 **Stage / ArkTS / API 26.0.0** 主线，先用规则路由，提供“回显”“文本长度”两个无网络、无额外业务权限的样例。应用页输入 → AgentService → IntentRouter → SkillRegistry → SkillExecutor → SkillInvoker → 应用业务 → 统一结果，模块已分开，便于四人并行修改。

同时提供两份应用 Skill 的 `SKILL.md`、ETS 入口及 `skillProfiles` 注册，供后续小艺路径验证；ETS 入口与应用内演示复用业务实现。

**当前自建 Agent 的默认适配器仅调用本应用业务函数。** 它验证框架接口，不等于通过系统 Skill 调度器调用脚本，也不证明可以发现或调用其他应用 Skill。`AgentExtensionAbility`、真实系统 Skill 调用适配器、外部调用鉴权和真机端到端验证，分别是成员 A/C/D 的后续工作。当前没有接入 LLM、WebView 或 A2A。

## 目录

```text
AppScope/                         应用级信息与资源
entry/
  skills/                         应用 Skill 声明及 ArkTS 入口（成员 C）
  src/main/
    module.json5                  Ability 与 Skill 注册（成员 A）
    ets/
      entryability/  pages/       应用入口与演示页（成员 A）
      agent/                     AgentService 装配归 A；契约/日志归 B
      router/  registry/         路由与能力目录（成员 B）
      runtime/  adapters/         执行器与调用适配（成员 C）
      service/                   无网络样例业务（成员 C）
      agentextension/            AgentExtensionAbility 接入任务（成员 A）
    resources/
docs/                             分工、流程、验收、记录（成员 D 汇总）
tools/check-structure.mjs          无 SDK 的工程结构检查
.github/                          审阅归属、PR 模板与 CI（成员 A）
```

在 DevEco Studio 26.0.0 中打开仓库根目录，完成 SDK 同步、构建和设备签名；详见[运行指南](docs/build-and-run.md)。只检查文件和注册关系时可运行：

```sh
node tools/check-structure.mjs
node tools/check-core.mjs
```

结构检查及纯逻辑检查均不会编译 ArkTS、生成 HAP 或调用设备。当前实测进展只以[记录目录](docs/records/README.md)中的证据为准。
