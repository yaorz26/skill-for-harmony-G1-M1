# C → A 交接：Skill 执行与调用适配

日期：2026-11-05  
交付人：C 李竞宇 / `lijingyuu`  
源码版本：`codex/member-c-skill-runtime`，提交 `947bc2b`  
验证环境：DevEco Studio 26.0.0.865 / SDK 26.0.0.105 / Hvigor 6.26.9 / Node 24.14.1

## 1. 状态

| 项目 | 状态 |
| --- | --- |
| 两个 Skill 样例（`g1-echo`、`g1-text-length`）及 `SKILL.md` | 已有，构建通过 |
| `SkillExecutor` 异常/超时/迟到结果 | F08/F09 Node 独立检查通过 |
| 未签名 HAP 构建 | 通过，见 [build-record.md](build-record.md) |
| 系统 → 应用入口（`skillProfiles` + `AgentExtensionAbility`） | 配置与源码已就位，未做设备验证 |
| 应用 → 系统真实 Skill 调用（A02） | **阻断**，公共 API 26 无发起接口，见 [api-research.md](api-research.md) |
| 真实调用适配器 | **未交付**（没有可用 API，不能用基线冒充） |

## 2. A 需要知道的接口

```ts
export interface SkillInvoker {
  executionPath: string;
  invoke(call: SkillCall): Promise<SkillResult>;
}
```

装配方式（A 维护 `AgentService`）：

```ts
const service = new AgentService(new InAppSkillInvoker());
```

- 当前唯一实现：`entry/src/main/ets/adapters/InAppSkillInvoker.ets`，`executionPath = 'in-app'`。
- 执行器：`entry/src/main/ets/runtime/SkillExecutor.ets`，默认 3000 ms，超时只结束等待，不取消底层操作，不自动重试。
- 若未来有真实 API，新增实现并注入；`executionPath` 使用经验证的路径值，不得继续用 `'in-app'` 或测试路径冒充系统调用。

## 3. 注册片段（当前已存在，无新增变更请求）

`entry/src/main/module.json5` 已包含以下 C 相关配置。A 装配时保持或按需调整，不需要 C 再改：

```json5
"extensionAbilities": [
  {
    "name": "AgentExtensionAbility",
    "srcEntry": "./ets/agentextension/AgentExtensionAbility.ets",
    "type": "agent",
    "exported": false,
    "metadata": [
      { "name": "ohos.extension.agent", "resource": "$profile:agent_config" }
    ]
  }
],
"skillProfiles": [
  {
    "name": "g1-echo",
    "abilityName": "EntryAbility",
    "version": "1.0.0",
    "srcEntries": ["../../skills/g1-echo/scripts/EchoSkill.ets"]
  },
  {
    "name": "g1-text-length",
    "abilityName": "EntryAbility",
    "version": "1.0.0",
    "srcEntries": ["../../skills/g1-text-length/scripts/TextLengthSkill.ets"]
  }
]
```

`entry/src/main/resources/base/profile/agent_config.json` 的 `agentCards[0]`：

- `agentId`: `g1m1-skill-agent`
- `appInfo`: `bundleName=com.g1m1.skillagent`、`moduleName=entry`、`abilityName=AgentExtensionAbility`
- `skills`: `g1-echo`、`g1-text-length`

## 4. Skill 入口契约

- 文件：`entry/skills/g1-echo/scripts/EchoSkill.ets`、`entry/skills/g1-text-length/scripts/TextLengthSkill.ets`
- 默认导出类，公开异步方法：
  - `g1-echo` → `echo(info: scriptManager.ArkTSScriptInfo, ...argv: string[])`
  - `g1-text-length` → `measure(info: scriptManager.ArkTSScriptInfo, ...argv: string[])`
- 参数：`argv[0]` 为文本；`requestId` 使用 `info.requestCode`。
- 结果：`AppSkillService.execute(call, 'system-skill')`，再由 `SystemSkillReporter.report` 调用 `scriptManager.completeArkTSScriptInApp` 上报。
- 业务限制：1–1024 个 UTF-16 码元，不能全为空白；超限/空白返回 `ERR_INVALID_PARAMS`。

## 5. 目标标识与权限

| 项目 | 值 / 说明 |
| --- | --- |
| Bundle | `com.g1m1.skillagent` |
| Module | `entry` |
| Agent Ability | `AgentExtensionAbility` |
| Skill ID | `g1-echo`、`g1-text-length` |
| 跨应用查询 Skill | `ohos.permission.MANAGE_SKILL_PRIVILEGE` 或 `ohos.permission.MANAGE_SKILL`（系统级，普通应用不可用） |
| AgentExtension 调用方/权限 | 当前未声明额外权限；受支持调用方与触发条件待 A 在设备上核实 |

## 6. 证据

- 构建：`assemble-hap.log`（`BUILD SUCCESSFUL`，34 tasks，HAP 108608 bytes，SHA256 `82B5E2A6893B5D385C30254B444003432B8274C3DAF277BB5AAD50E786507BF2`）。
- 结构：`structure.log`（98 文件、2 个 Skill profile）。
- 核心：`check-core.log`（23 项）。
- F08/F09：`check-executor.log`（18 项，单次 `ERR_INTERNAL`、超时后迟到结果不改写/不重试/不二次回包）。
- API 调研：`api-research.md`。

## 7. 阻断与需要 A/D 决定的事

1. **A02 阻断**：SDK 26.0.0.105 公共声明没有应用发起 Skill 调用的 API。`skillManager` 只查、`scriptManager` 只报、`AgentHostProxy` 只回发、HMS AgentFramework 只是 UI。不要为满足验收而把 `InAppSkillInvoker` 改名为系统适配器。
2. **S01/S02 可继续**：需要 A 装配后，在目标设备/系统入口验证“系统发现并执行本应用 Skill”。验证点是 `system_skill_entered`、业务结果、`system_result_reported` 和最终回包。
3. **构建路径**：Hvigor 拒绝含中文的工程路径（`00306003`）。复现构建必须使用全 ASCII 路径；本轮使用 `D:\LJY\grade3\curriculum\g1m1-verify`。
4. **无设备**：安装、页面启动、组件连接、系统匹配均未测；不要把本轮构建记录标成任务一全量完成。

## 8. 复现

```powershell
# 在 ASCII 路径的仓库副本中
.\tools\build-hap.ps1 -DevEcoRoot 'D:\Huawei\DevEco Studio 26.0.0'

node tools/check-structure.mjs
node tools/check-core.mjs
node docs/records/2026-11-05-C-runtime/check-executor.mjs
```

若需把 stderr 单独保存，直接调用 Hvigor，避免 `build-hap.ps1` 把 WARN 当作终止错误：

```powershell
& "$root\tools\node\node.exe" "$root\tools\hvigor\bin\hvigorw.js" `
  --mode module -p product=default -p module=entry@default assembleHap --no-daemon
```
