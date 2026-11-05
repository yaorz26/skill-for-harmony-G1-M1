# 应用发起系统 Skill 调用：API 26 声明核实

日期：2026-11-05  
执行者：C 李竞宇 / `lijingyuu`  
SDK：HarmonyOS 26.0.0.105（`apiVersion=26`，`Release`）  
SDK 根目录：`D:\Huawei\DevEco Studio 26.0.0\sdk\default`

## 1. 问题

自建 Agent（本应用）能否通过公共 SDK 主动发起一次系统 Skill 调用，并取得可关联的返回？

需要区分四条容易混用的路径：

1. 应用内直接执行业务（现有 `InAppSkillInvoker`）。
2. 系统调用方进入本应用的 `skillProfiles` / `AgentExtensionAbility`（系统 → 应用）。
3. 本应用向系统或他应用发起 Skill 调用（应用 → 系统，即 A02 目标）。
4. 使用 HMS AgentFramework 组件打开小艺入口（UI 入口，不是程序化调用）。

## 2. 方法与结果

### 2.1 声明文件清单

```powershell
$sdk = 'D:\Huawei\DevEco Studio 26.0.0\sdk\default'
Get-ChildItem -LiteralPath "$sdk\openharmony\ets\api","$sdk\hms\ets\api" -Recurse -File -Filter '*.d.ets' |
  Where-Object { $_.Name -match 'skill|script|Agent' } |
  Select-Object -ExpandProperty FullName
```

相关文件：

```text
openharmony\ets\api\@ohos.bundle.skillManager.d.ts
openharmony\ets\api\@ohos.app.ability.scriptManager.d.ts
openharmony\ets\api\@ohos.app.agent.AgentExtensionAbility.d.ts
openharmony\ets\api\@ohos.app.agent.AgentUIExtensionAbility.d.ts
openharmony\ets\api\@ohos.app.agent.agentConstant.d.ts
openharmony\ets\api\application\AgentCard.d.ts
openharmony\ets\api\application\AgentHostProxy.d.ts
openharmony\ets\api\application\AgentExtensionContext.d.ts
openharmony\ets\api\bundleManager\Skill.d.ts
openharmony\ets\api\bundleManager\SkillInfo.d.ts
hms\ets\api\@hms.ai.AgentFramework.d.ets
```

### 2.2 逐项结论

| 声明 | 提供的能力 | 是否可用于“应用发起 Skill” |
| --- | --- | --- |
| `@ohos.bundle.skillManager` | `getSkillInfoForSelf`、`getSkillInfosForSelf`、`getSkillInfo`、`getSkillInfos`、`getAllSkillInfos`；只读查询 `SkillInfo` / `SkillType` | **否**。仅查询；跨应用查询需要 `ohos.permission.MANAGE_SKILL_PRIVILEGE` 或 `ohos.permission.MANAGE_SKILL` |
| `@ohos.app.ability.scriptManager` | `completeArkTSScriptInApp(context, requestCode, result)`；`ArkTSScriptInfo`、`ExecuteResult` | **否**。是 Skill **结果上报/完成**接口，不是发起调用接口 |
| `@ohos.app.agent.AgentExtensionAbility` | `onCreate`、`onConnect`、`onData`、`onAuth`、`onDisconnect`、`onDestroy`；`context.agentCard` | **否**。这是应用作为 Agent 服务端被连接时的生命周期；没有调用外部 Skill 的方法 |
| `application/AgentHostProxy` | `sendData(data)`、`authorize(handshakeData)` | **否**。只向已连接的调用方回发数据/认证，不能发起新调用 |
| `application/AgentCard` / `bundleManager/SkillInfo` | Agent/Skill 的 id、name、description、tags、路径、版本、可见性等元数据 | **否**。用于声明/发现，不含调用 |
| `@hms.ai.AgentFramework.d.ets` | `AgentController.isAgentSupport`、`on/off('agentDialogOpened'|'agentDialogClosed')`、`FunctionComponent`、`FunctionController` | **否**。当前是打开小艺 Agent 弹窗的 UI 组件；`FunctionController` 注释明确为 reserved，无额外实现 |
| `@ohos.bundle.bundleManager` | `GET_BUNDLE_INFO_WITH_SKILL`、`Skill`、`SkillInfo` | **否**。Bundle 查询标志与数据结构 |

### 2.3 符号检索

```powershell
$sdk = 'D:\Huawei\DevEco Studio 26.0.0\sdk\default'
rg -n --glob '*.d.ts' --glob '*.d.ets' `
  -e 'executeSkill' -e 'invokeSkill' -e 'startSkill' -e 'callSkill' -e 'SkillInvoker' `
  "$sdk\openharmony\ets\api" "$sdk\hms\ets\api"
```

结果：无匹配（`rg` 退出码 1）。公共 API 26 声明中没有“执行/调用 Skill”的入口符号。

### 2.4 与现有工程的关系

- `entry/src/main/module.json5` 已注册两个 `skillProfiles` 与 `type: "agent"` 的 `AgentExtensionAbility`；`entry/skills/*/scripts/*.ets` 导出默认类并实现 `public async echo/measure(info: scriptManager.ArkTSScriptInfo, ...argv)`。
- 这对应“系统 → 应用”的入口形态：系统带 `ArkTSScriptInfo + argv` 进入脚本，脚本调用 `AppSkillService`，再通过 `completeArkTSScriptInApp` 上报。
- 未签名构建已通过（`assemble-hap.log`），说明构建器接受当前 `.ets` 入口与 `skillProfiles` 配置；但**构建通过不等于系统发现、匹配或执行**。
- 现有 `InAppSkillInvoker` 只是应用内基线，`executionPath='in-app'`；不得改名或包装成系统调用证据。

## 3. 结论

1. **A02（自建 Agent 发起真实 Skill 调用）在公共 SDK 26.0.0.105 上阻断**：没有可用的发起 API。`skillManager` 只能查，`scriptManager` 只能报，`AgentExtensionAbility`/`AgentHostProxy` 只能作为被连接方收发，HMS AgentFramework 只是 UI 入口。
2. **S01/S02（系统发现并执行本应用 Skill）仍可继续验证**：入口源码、`skillProfiles` 和结果上报接口都已具备；需要目标设备/系统入口与 A 的装配。
3. 不新增“看起来能调用”的适配器。若后续确认存在系统应用/白名单/私有 API，再单独实现 `SkillInvoker`，并补充调用方权限、目标标识、取消/迟到结果处理与真实返回证据。

## 4. 复现

```powershell
# 1. 查看关键字声明
$sdk = 'D:\Huawei\DevEco Studio 26.0.0\sdk\default'
rg -n 'completeArkTSScriptInApp|getSkillInfo|AgentHostProxy|sendData|isAgentSupport' `
  "$sdk\openharmony\ets\api" "$sdk\hms\ets\api"

# 2. 确认没有发起调用的符号
rg -n --glob '*.d.ts' --glob '*.d.ets' `
  -e 'executeSkill' -e 'invokeSkill' -e 'startSkill' -e 'callSkill' -e 'SkillInvoker' `
  "$sdk\openharmony\ets\api" "$sdk\hms\ets\api"
```

相关构建与检查证据见 [build-record.md](build-record.md)。
