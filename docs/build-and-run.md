# 构建与运行

## 1. 基线与前置条件

- 项目：Stage、ArkTS，目标/兼容版本均配置为 `26.0.0`，设备类型为 phone/tablet。
- 工程已通过本地 DevEco 26.0.0.865 / SDK 26.0.0.105 / Hvigor 6.26.9 构建，生成未签名 HAP；记录见[构建与审阅验证](records/2026-11-03-review.md)。签名、安装与真机调用仍待验证。
- 最新 [A 装配构建](records/2026-11-04-A-integration.md)包含已注册的 Agent 组件/AgentCard 与 B 路由交付，共享 23 项检查及 A 目录内 32 项独立自测通过；不改动 D 的共享检查器/CI。组件非导出、认证未配置，没有设备成功记录。
- 使用 DevEco Studio 26.0.0 及相应 HarmonyOS SDK。由 A 首次构建时记录完整版本、Build 号、Hvigor/ohpm 版本、宿主系统和实际设备信息。
- 无业务网络调用、云密钥或额外业务权限。设备部署签名由每人本地配置。

Skill 从 API 26.0.0 开始提供；ArkTS 入口方式仅支持 Stage。以[官方指南](https://developer.huawei.com/consumer/cn/doc/doccenter-capabilities/arkts-skill-development-guide)及实际目标 SDK 为准。

## 2. 导入与构建

1. 在 DevEco Studio 打开仓库根目录（包含 `AppScope`、`entry`、`build-profile.json5` 和 `hvigorfile.ts`）。
2. 配置 SDK，执行工程同步，等待 IDE 获取匹配的构建工具。仓库未携带本机 SDK 路径或 Hvigor 二进制包装器。
3. 选 `default` product、`entry` 模块、debug 模式，执行 `Build > Build Hap(s)/APP(s) > Build Hap(s)`，或当前版本等效菜单。
4. 保存完整构建输出、首条错误/错误码、退出状态及实际产物路径。在工具链已经提供 Hvigor 的终端中，可用以下任务参数；执行程序路径取自本人 DevEco 安装，不假设系统存在 `hvigorw`：

```text
<本机 Hvigor 启动程序> --mode module -p product=default -p module=entry@default assembleHap --analyze=normal --parallel --incremental --daemon
```

5. 如需真机部署，在 IDE 的 Signing Configs 中配置调试签名。共享 `build-profile.json5` 默认没有签名；不要把证书、密码或本机签名路径提交。
6. 按[模板](templates/build-record.md)建记录；编译失败也提交失败记录，不填“预计成功”。

Windows 已安装完整 DevEco 时，也可使用 [build-hap.ps1](../tools/build-hap.ps1)，无需把工具链永久加入 PATH：

```powershell
.\tools\build-hap.ps1 -DevEcoRoot 'D:\你的安装目录\DevEco Studio'
```

若 SDK 不在安装目录的 `sdk/` 下，补 `-SdkRoot '实际SDK根目录'`。脚本只临时设置工具路径并在结束后恢复，输出产物通常为 `entry/build/default/outputs/default/entry-default-unsigned.hap`；产物与本机配置不提交。

## 3. 应用内演示

1. 选择支持目标版本的模拟器或真机，部署并启动 `Skill Agent Demo`。
2. 输入 `回显 你好，鸿蒙`，点击运行，检查 `status: success`、`skillId: g1-echo` 和 `executionPath: in-app`。
3. 输入 `长度 你好ABC`，检查 `data.length: 5`、`unit: utf16-code-unit`。
4. 输入 `查天气` 和 `回显`，分别检查 `ERR_NO_SKILL`、`ERR_INVALID_PARAMS`。
5. 在日志窗口按 `[G1M1]` 过滤，保存同一 `requestId` 的链路。以上预期均需实测后才能标通过。

页面提供回显、长度和未命中快捷样例，请求 ID 可复制；日志 `page_loaded` 仅证明页面加载，不能代替组件连接。组件请求格式、调用方/认证阻断和设备补测步骤见 [AgentExtensionAbility](../entry/src/main/ets/agentextension/README.md)。

## 4. 系统应用 Skill 验证（独立步骤）

1. A/C 先确认当前工程两份 `skillProfiles` 注册能构建，Skill 名称/目录/声明/入口方法一致。
2. 根据官方当前支持的流程完成 HAP 导入和真机测试，记录支持的调用方、设备、账号条件与实际输入。[导入 Skill](https://developer.huawei.com/consumer/cn/doc/service/import-skill-0000002592931542)、[真机测试](https://developer.huawei.com/consumer/cn/doc/service/skill-real-machine-testing-0000002592771628)
3. 保存系统选择目标 Skill 的证据、`system_skill_entered`、业务结果、`system_result_reported` 和最终返回。
4. 上述路径验证系统调用方到应用 Skill；自建 Agent 能否发起同类调用仍由 C 核实调用 API，不能由这一步代替。
5. 扩展组件接入按 [agentextension 任务说明](../entry/src/main/ets/agentextension/README.md)独立验证。

## 5. 没有工具链或设备时

可先做接口联调准备、结构检查、静态审阅和记录整理：

```sh
node tools/check-structure.mjs
node tools/check-core.mjs
```

检查器使用 Node.js 24，无第三方依赖。结构检查验证配置资源、Skill 名称/路径/方法/参数声明、局部源码导入和 Markdown 相对链接。核心检查用 Node 自带类型擦除运行同一份纯逻辑 ETS 源码的 TypeScript 子集，验证路由、错误、UTF-16 长度及异步超时；不加载 ArkUI 或 HarmonyOS API，也不验证 ArkTS 严格类型规则。两者均不替代构建、安装、应用运行或系统测试。
