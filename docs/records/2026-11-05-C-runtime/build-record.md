# C 运行时、构建与执行器记录（2026-11-05）

负责人：C 李竞宇 / `lijingyuu`  
分支：`codex/member-c-skill-runtime`（基线提交 `947bc2b`；本记录、检查脚本与文档为工作区新增）  
目标：在 DevEco Studio 26 / API 26 环境验证工程可构建，并补齐 F08/F09 的执行器独立检查与真实调用 API 调研。

## 1. 结论

| 项目 | 结果 | 证据 |
| --- | --- | --- |
| 未签名 HAP 构建 | 通过（34 tasks，clean build） | [assemble-hap.log](assemble-hap.log)、[assemble-hap.err.log](assemble-hap.err.log) |
| 结构检查 | 通过（98 文件、2 个 Skill profile） | [structure.log](structure.log) |
| 共享核心检查 | 通过（23 项） | [check-core.log](check-core.log) |
| F08/F09 独立执行器检查 | 通过（18 项） | [check-executor.mjs](check-executor.mjs)、[check-executor.log](check-executor.log) |
| 应用发起系统 Skill 调用 | **阻断**：公共 SDK 26.0.0.105 未提供接口 | [api-research.md](api-research.md) |
| 安装、启动、系统匹配/执行 | 未验证（`hdc list targets` 为空） | [hdc-targets.log](hdc-targets.log) |

F08/F09 仅为 Node 纯逻辑注入检查，D 仍需在目标鸿蒙运行时复测并更新验收表。

## 2. 环境

| 组件 | 版本 / 路径 |
| --- | --- |
| 操作系统 | Windows 11 家庭中文版 10.0.26200 |
| DevEco Studio | 26.0.0.865，build `261.23567.138.36.2600865`，安装于 `D:\Huawei\DevEco Studio 26.0.0` |
| HarmonyOS SDK | 26.0.0.105，`apiVersion=26`，`platformVersion=26.0.0`，`Release` |
| Hvigor | 6.26.9 |
| Node.js | v24.14.1（随 IDE） |
| ohpm | 26.0.0.630 |
| Java | JBR 25.0.2+1-329.117-nomod |

## 3. 构建路径限制与处理

首次在 `D:\LJY\grade3\curriculum\鸿蒙\skill-for-harmony-G1-M1` 执行构建时，Hvigor 报：

```text
ERROR: 00306003 Specification Limit Violation
Invalid project path. Current path does not match: ...\鸿蒙\skill-for-harmony-G1-M1
```

工程路径不允许非 ASCII 字符。为不改动用户目录，使用 ASCII 路径的 Git worktree 完成验证：

```text
D:\LJY\grade3\curriculum\g1m1-verify
```

该 worktree 以 detached HEAD 检出 `947bc2b`，源码与主工作区一致。**A/D 在复现构建前，应把检出目录放到全 ASCII 路径**（父目录也不能含中文），否则无法进入编译阶段。

## 4. 构建命令

```powershell
$root = 'D:\Huawei\DevEco Studio 26.0.0'
$env:DEVECO_SDK_HOME = "$root\sdk"
$env:JAVA_HOME = "$root\jbr"
$env:PATH = "$root\tools\node;$root\tools\ohpm\bin;$env:PATH"

& "$root\tools\node\node.exe" "$root\tools\hvigor\bin\hvigorw.js" `
  --mode module -p product=default -p module=entry@default `
  assembleHap --no-daemon
```

等价脚本入口：

```powershell
.\tools\build-hap.ps1 -DevEcoRoot 'D:\Huawei\DevEco Studio 26.0.0'
```

> 注意：在 PowerShell 中把构建 stderr 用 `2>&1` 合并进管道时，Hvigor 的 WARN 会被 `build-hap.ps1` 内部的 `$ErrorActionPreference = 'Stop'` 当作终止错误。记录本轮使用上面的直接命令，并将 stdout/stderr 分开保存。

## 5. 产物

| 项目 | 值 |
| --- | --- |
| 产物 | `entry/build/default/outputs/default/entry-default-unsigned.hap` |
| 大小 | 108608 bytes |
| SHA256 | `82B5E2A6893B5D385C30254B444003432B8274C3DAF277BB5AAD50E786507BF2` |
| 构建耗时 | `BUILD SUCCESSFUL in 7 s 423 ms`（clean build） |
| 任务数 | 34 tasks executed, 0 up-to-date |

产物位于 ASCII worktree，未复制回主工作区；`entry/build/` 被 `.gitignore` 排除。

## 6. 警告

```text
ArkTS:WARN File: entry/src/main/ets/agentextension/AgentExtensionAbility.ets:13:16
Function may throw exceptions. Special handling is required.

WARN: No signingConfig found for product default
```

第一条来自 A 维护的 `HostResponseSender.sendData()` 调用；第二条表示未配置签名，符合本轮的未签名构建口径。两者均未阻断构建。

## 7. 检查

```powershell
node tools/check-structure.mjs
node tools/check-core.mjs
node docs/records/2026-11-05-C-runtime/check-executor.mjs
```

`check-executor.mjs` 覆盖：

- F08：注入抛错的 `SkillInvoker`，只调用一次适配器，只返回一次 `ERR_INTERNAL`，并保留注入的 `executionPath`。
- F09：注入 30 ms 适配器、5 ms 超时，先返回 `ERR_TIMEOUT`；30 ms 后底层完成，但返回值不被改写、不重试、不二次回包。
- 正常注入适配器仍返回业务结果（`g1-text-length`，`你好ABC` → 5），证明正式样例没有故障开关。

Node 检查只执行纯逻辑 ETS，不验证 ArkTS 严格类型、SDK 兼容性、系统 Skill 入口或设备行为。

## 8. 未验证 / 交接

- 无设备（[hdc-targets.log](hdc-targets.log) 输出 `[Empty]`），未执行 `hdc install`、页面启动或系统 Skill 匹配/执行。
- S01/S02、A01/A02、E01 仍未完成；A02 的阻断依据见 [api-research.md](api-research.md)。
- 给 A 的装配与注册说明见 [handoff.md](handoff.md)。
