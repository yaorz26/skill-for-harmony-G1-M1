# 2026-11-03：仓库框架初始化

本次为静态框架准备，不是设备实验报告。

| 项目 | 结果 |
| --- | --- |
| 目标仓库 | yaorz26/skill-for-harmony-G1-M1；初始化前为空 |
| 工程配置参考 | 本地 DevEco 26.0.0 模板的结构与版本；未复制签名、依赖缓存或私人配置 |
| 宿主 | Windows / PowerShell |
| Node | v24.20.0 |
| 结构检查命令 | `node tools/check-structure.mjs` |
| 静态检查结果 | 通过，退出码 0；配置、资源、2 份 Skill 注册、源码引用与文档链接已检查 |
| 纯逻辑检查命令 | `node tools/check-core.mjs` |
| 纯逻辑结果 | 17 项通过，退出码 0；路由、参数、Unicode 长度、异常、超时与迟到完成 |
| 检查日志 | [structure.log](2026-11-03-bootstrap/structure.log)、[core.log](2026-11-03-bootstrap/core.log) |
| DevEco/Hvigor 构建 | 未执行；当前会话未配置可用的构建工具链 |
| HAP / 安装 / 应用运行 | 未测，无产物 |
| AgentExtensionAbility | 待实现，未注册 |
| 真实系统 Skill 发起调用适配器 | 待实现；现有 InAppSkillInvoker 只复用应用业务 |
| 系统 Skill / 真机端到端 / 性能 | 未测 |

核心检查仅由 Node 类型擦除加载纯逻辑 ETS 的 TypeScript 子集，日志中的 `[G1M1]` 事件来自 Node 进程，不能当作鸿蒙设备日志。Node 对此功能给出实验性功能提示，检查退出码为 0。

原始实验方案已按字节复制到参考目录并核对 SHA256 一致。官方开发指导已核对 Skill 的目录、注册、入口参数和结果上报形式；ArkTS 源码还需要目标 SDK 实际编译。参考：[华为应用 Skill 开发指导](https://developer.huawei.com/consumer/cn/doc/doccenter-capabilities/arkts-skill-development-guide)。

下步由 A 首先提交一次真实构建记录，B/C 验证核心和样例，D 按验收清单组织设备联调。
