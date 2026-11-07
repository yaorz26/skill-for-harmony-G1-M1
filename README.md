# G1-M1：可调用应用 Skill 的自建 Agent

四人共同完成任务一：先交付可继续开发的鸿蒙 Agent 框架，再在真机上验证应用 Skill 调用。框架交付截止 **2026-11-09（周一）**。成员身份、目录分工和交接条件见[四人分工](docs/team-plan.md)。

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

**当前自建 Agent 的默认适配器仅调用本应用业务函数。** 它验证框架接口，不等于通过系统 Skill 调度器调用脚本，也不证明可以发现或调用其他应用 Skill。B 的规则路由/目录已装配；A 已实现并注册 `AgentExtensionAbility`、AgentCard 和按连接隔离的 JSON 请求桥接，已通过编译，组件仍保持非导出。真实调用方/认证、真实系统 Skill 调用适配器与真机端到端验证尚未完成。当前没有接入 LLM、WebView 或 A2A。

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
      agentextension/            AgentExtensionAbility 与请求桥接（成员 A）
    resources/
docs/                             分工、流程、验收、记录（成员 D 汇总）
tools/check-structure.mjs          无 SDK 的工程结构检查
.github/                          PR 模板与 CI
```

在 DevEco Studio 26.0.0 中打开仓库根目录，完成 SDK 同步、构建和设备签名；详见[运行指南](docs/build-and-run.md)。只检查文件和注册关系时可运行：

```sh
node tools/check-structure.mjs
node tools/check-core.mjs
```

结构检查及纯逻辑检查均不会编译 ArkTS、生成 HAP 或调用设备。当前实测进展只以[记录目录](docs/records/README.md)中的证据为准。

当前验证：共享结构检查、原有 23 项核心检查、A 交付目录内独立的 32 项入口/装配自测，以及含 Agent 组件的 DevEco/Hvigor 未签名 HAP 构建通过；安装、设备运行与系统调用未测。A 自测未并入 D 的共享 CI。最新证据及 B/D 交接建议见 [A 装配记录](docs/records/2026-11-04-A-integration.md)，早期独立审阅见[脚手架审阅](docs/reviews/2026-11-03-scaffold-review.md)。

### 2026-11-07 验收进展补充

上段保留了早期阶段的验证口径；后续固定源码 `ab9691f` 已完成 [DevEco IDE 同步](docs/records/2026-11-06-D-ide-sync/report.md)、调试签名构建及 [Pura 70 安装/操作与 F03/F04](docs/records/2026-11-06-D-signed-device/report.md)。F05–F10 的真机**应用内/自检**结果见[补测记录](docs/records/2026-11-07-D-device-followup/report.md)。[小艺真机尝试](docs/records/2026-11-07-D-xiaoyi-discovery/report.md)中，两个目标 Skill 均未被找到，S01 当前未通过、S02 未触发。真实外部 Agent 回调、主动系统 Skill 调用及完整端到端路径仍未验收；本机与 CI 的结构/逻辑检查不能代替这些路径。

[小艺平台复核](docs/records/2026-11-07-D-platform/report.md)已确认当前账号导入两个 Skill，创建含当前账号的真机测试组及关联应用 APP ID，并把两项 Skill 发布给该组。发布后的真机回复已有变化，但长度结果错误且没有系统脚本入口/上报证据，S01/S02 尚不能改判通过。

后续在小艺“Skill真机测试中”入口重新执行并留存[系统 Skill 真机证据](docs/records/2026-11-07-D-system-skill/report.md)：`g1-echo`、`g1-text-length` 均有小艺调度、对应 ArkTS 入口、`system_skill_entered`、业务结果、`system_result_reported` 及最终回复。**S01、S02 按本轮正常调用范围已验证。**S02 无效参数分支没有取得系统入口证据，按本轮决定不补测、不计入收口条件；此前段落反映初测时点。A02 自建 Agent 主动调用和 E01 完整目标路径仍未通过。

其他成员使用不同华为手机复测时，按[系统 Skill 换设备手册](docs/system-skill-device-runbook.md)核对设备版本、测试组、签名 HAP、快捷入口和同一请求的系统日志。
