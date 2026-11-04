# 2026-11-04：A 工程入口与 B 模块装配

本轮从远端 `main` 拉取 `3463f25`（B 的 [PR #3](https://github.com/yaorz26/skill-for-harmony-G1-M1/pull/3)），在 `codex/member-a-entry-integration` 完成 A 当前可独立推进的代码和编译工作。用户确认暂时没有设备，先完成代码和构建。LLM 暂未接入，C 的真实系统 Skill 调用适配器及 D 的设备验收未代做。

## 交付

- [AgentService](../../entry/src/main/ets/agent/AgentService.ets)装配 B 的同步路由端口与能力目录，支持 `AgentService(invoker, router, registry)`，默认参数兼容原调用；未命中提示从目录生成，路由抛错转为统一错误，执行器继续复核白名单。
- [组件入口](../../entry/src/main/ets/agentextension/AgentExtensionAbility.ets)、[请求桥接](../../entry/src/main/ets/agentextension/AgentRequestBridge.ets)及 `type: agent` / AgentCard 注册齐备。使用 SDK 的 `onConnect/onData/onDisconnect/onDestroy` 和 `common.AgentHostProxy.sendData()`；纯 JSON/业务桥接可单独验证。
- 页面增加回显、长度、未命中快捷样例与可复制 requestId，提示读取同一注册表；执行中锁定输入与按钮。页面加载完成有 `page_loaded` 日志。
- 按连接隔离请求；同一连接重复 ID 拒绝、并行上限 8、累计接受 ID 上限 128、组件连接上限 8，断开后丢弃迟到回包；发送失败记录独立阶段，日志不含请求正文或握手数据。

## 已执行验证

| 项目 | 结果 / 证据 |
| --- | --- |
| 工程结构、资源与引用 | [structure.log](2026-11-04-A-integration/structure.log)，增加组件/AgentCard/白名单一致性检查 |
| Node 纯逻辑 | [core.log](2026-11-04-A-integration/core.log)，50 项通过；只验证本地 ETS 逻辑，不加载鸿蒙 SDK |
| Hvigor assembleHap | [assemble-hap.log](2026-11-04-A-integration/assemble-hap.log)，退出 0，BUILD SUCCESSFUL，5.477 秒，33 tasks（17 executed / 16 up-to-date） |
| 初次编译错误留档 | [compile-failure-import.log](2026-11-04-A-integration/compile-failure-import.log)，不能从 Kit 顶层导入 AgentHostProxy；已改用 common.AgentHostProxy。显式 HostResponseSender 适配类同时解决 ArkTS 不支持结构类型赋值的问题 |
| HDC 目标 | [hdc-targets.log](2026-11-04-A-integration/hdc-targets.log)，返回 Empty，无设备 |
| SDK 依据 | [sdk-audit.json](2026-11-04-A-integration/sdk-audit.json)，记录本机声明/Schema 的摘要与哈希，未复制整个 SDK |
| 签名、安装、页面运行、组件回调、系统 Skill、端到端 | 未测，不能据编译或 Node 成功标记为通过 |

新增核心检查覆盖：B 的可注入路由/目录/动态提示、路由异常、越过白名单的路由结果不执行；JSON 类型/长度/字段校验，业务结果保留 in-app；三路并发关联、不同连接相同 ID、同连接重复 ID、并发/累计额度、关闭连接及迟到结果丢弃、发送失败与日志不含正文。系统 proxy 身份稳定性、组件连接上限与真实回调依然需要设备检查。

## 构建环境与产物

DevEco Studio `26.0.0.865`（Build `261.23567.138.36.2600865`），HarmonyOS SDK `26.0.0.105 Release` / API 26，Hvigor `6.26.9`，构建 Node `v24.14.1`；核心检查 Node `v24.20.0`，宿主 Windows / PowerShell。product=`default`，module=`entry@default`，debug。

复现：`./tools/build-hap.ps1 -DevEcoRoot '<DevEco 安装根目录>'`。脚本临时设置工具链环境，构建 `assembleHap --no-daemon`，不更改系统环境或签名配置。

产物 `entry/build/default/outputs/default/entry-default-unsigned.hap`，101984 字节，SHA256 `4e575b3af2705628523b0dec1ada0516c127ebfd60ac4e63eda569d77dcad9b4`。未提交构建二进制。构建提示 `No signingConfig found for product default`，因此不是可声称已安装的签名版本。

## SDK 核验与真实入口阻断

本机 SDK 明确 AgentExtensionAbility 从 API 24 提供，限 Stage，syscap 为 `SystemCapability.Ability.AgentRuntime.Core`。API 26 Schema 接受 `type: agent`，Hvigor 对 `ohos.extension.agent → $profile:agent_config` 执行 AgentCard Schema 校验。本轮 API 导入、回调签名、注册和打包均通过真实编译。

组件保留 **exported=false**；`onAuth` 只记录未配置，不回显握手或无条件 authorize。声明没有给回调附加权限名，不代表任意调用方都能连接。当前未核实受支持客户端连接 API/账号/权限、认证协议或设备支持情况，不能借 Want 的目标 bundleName 认证调用方。AgentCard 是本地能力描述，不代表 A2A 或应用 Skill 已被系统调度。

已尝试读取华为官方在线资料，但联网搜索工具返回 500、官方文档页面只返回前端壳；因此本次以已安装官方 SDK 声明、Schema 和编译器为依据，不声称在线指南已核验。设备接入说明见 [组件文档](../../entry/src/main/ets/agentextension/README.md)。

## 交接与下一步

| 接收方 | 已可接收 | 尚需前置 |
| --- | --- | --- |
| B | 规则路由/目录已装配，接口旧调用继续可用 | LLM 如后续交付，须另行确认异步端口及超时；本轮不等待 |
| C | invoker 注入位置、组件/Skill 配置分层明确 | 真实 Skill API、目标/权限、返回约定及可运行适配器 |
| D | 固定源码版本、未签名 HAP 构建依据、50 项可复现逻辑检查、更新流程图 | 真机与本地调试签名；调用方/认证条件确认；再开展 F02/A01/A02/A03/E01 |
| A | 当前独立代码与编译工作完成 | 取得设备后安装/页面运行、验证真实组件回调；C 交付后装配真实调用，D 验收后收口 |

当前结论：工程入口和请求桥接已实现、B 模块已装配并通过编译；真实组件连接、认证及系统 Skill 调用未完成。不得将本轮记录作为真机成功报告。
