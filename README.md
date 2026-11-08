# G1-M1：可调用应用 Skill 的自建 Agent

四人共同完成任务一：先交付可继续开发的鸿蒙 Agent 框架，再在真机上验证应用 Skill 调用。框架交付截止 **2026-11-09（周一）**。成员身份、目录分工和交接条件见[四人分工](docs/team-plan.md)。

**11-08 框架交付：**框架、Demo 工程、调度流程图、构建与运行记录已齐备；B/C/D 文档收尾已统一完成，最终入口见[交付索引](docs/delivery-index.md)。MateBook 应用内运行/自检和 D 手机小艺正常系统调用分别有证据。A01/A02/A03/E01 仍未验证或受阻，PC 小艺不作为本轮必交条件，不追加手机实验；不宣称完整自建 Agent 系统链路通过。

## 先看这些

- [四人分工与每日里程碑](docs/team-plan.md)
- [最终交付索引](docs/delivery-index.md)、[交付审查记录](docs/reviews/2026-11-08-final-delivery-review.md)
- [独立开发与交接顺序](docs/team-plan.md#7-必需依赖与先后顺序)、[PR 与自动合并规则](docs/github-workflow.md)
- [调度流程与当前实现边界](docs/architecture.md)
- [接口、输入输出与错误码](docs/interfaces.md)
- [构建与运行](docs/build-and-run.md)
- [验收用例](docs/acceptance.md)、[构建与运行记录](docs/records/README.md)
- [文档索引](docs/README.md)、[协作约定](CONTRIBUTING.md)

## 当前框架

采用 **Stage / ArkTS / API 26.0.0** 主线，先用规则路由，提供“回显”“文本长度”两个无网络、无额外业务权限的样例。应用页输入 → AgentService → IntentRouter → SkillRegistry → SkillExecutor → SkillInvoker → 应用业务 → 统一结果，模块已分开，便于四人并行修改。

同时提供两份应用 Skill 的 `SKILL.md`、ETS 入口及 `skillProfiles` 注册；ETS 入口与应用内演示复用业务实现。D 的历史手机版本已通过小艺正常调用，当前账号包名与平台名称的对应见[版本表](docs/system-skill-device-runbook.md#1-先记录这一轮使用的版本)。

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

## 已验证结果与交付范围

| 内容 | 实际状态与证据 |
| --- | --- |
| 主机检查与 HAP 构建 | [五组主机检查](docs/records/2026-11-08-A-closeout/host/summary.md)通过：核心 28 项、A 32 项、C 18 项及证据工具；[DevEco 26 / SDK 26 构建](docs/records/2026-11-08-A-closeout/build-summary.json)成功，CI 使用同一主机采集入口 |
| 当前包名的 MateBook 运行 | 应用源码 `c7d23d7`，`com.yaorz26.g1m1.skillagent`：[签名安装、13 笔应用内输入、9 项自检](docs/records/2026-11-07-A-account-bundle-device/report.md)通过 |
| D 手机历史版本 | `ab9691f`、`com.g1m1.skillagent`：[Pura 70 应用内/自检](docs/records/2026-11-07-D-device-followup/report.md)及[两项小艺正常调用](docs/records/2026-11-07-D-system-skill/report.md)通过；不代替新包名系统调用验证 |
| 保留的限制 | S02 无效参数系统分支未验证；PC 小艺测试入口未就绪；A01/A03 真实组件调用未验证，A02 真实适配器未交付，E01 完整系统链路未通过 |

详细状态见[验收表](docs/acceptance.md)，固定源码、HAP 哈希、交付材料及恢复条件见[最终交付索引](docs/delivery-index.md)。既有失败尝试和早期构建保留在[记录目录](docs/records/README.md)，不以历史状态覆盖当前结果。

本轮以框架及已有运行证据交付，剩余系统目标登记阻断；后续有条件换设备复现时，按[系统 Skill 换设备手册](docs/system-skill-device-runbook.md)核对版本、账号、签名、发布、快捷入口和同一请求日志。
