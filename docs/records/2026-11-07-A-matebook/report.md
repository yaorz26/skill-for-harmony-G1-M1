# A：MateBook 14 鸿蒙电脑适配与真机冒烟测试

日期：2026-11-07（北京时间）。执行工作包：A 工程配置、安装和装配验证。设备持有人在 DevEco 中完成开发者账号登录与调试签名授权。

## 被测源码与设备

- 基线：`main@b3bad8719fc825274ee28ce9fd2ef3d6dc4f322a`，已包含 D 的 PR #13；本轮仅在 `entry/src/main/module.json5` 的 `deviceTypes` 增加 `2in1`。
- 被测应用源码对应 `3f080148c29d1767536445355b6b06c86c8f9f99`，分支 `codex/member-a-matebook-device`。签名工程取自该源码，只有本地构建配置增加调试签名；[一致性记录](source-parity.json)核对的 34 个应用源码、资源和构建入口文件全部相同。
- 用户提供型号：HUAWEI MateBook 14，MNTXM-24B。设备实际读取：API 26、`OpenHarmony-7.0.0.109`、`2in1`、`arm64-v8a`，见 [环境](environment.txt)。
- 通过同一手机热点的 HDC TCP 连接；不记录设备序列号、网络地址、账号或签名材料。

## 构建、签名和安装

| 项目 | 结果 / 证据 |
| --- | --- |
| 本机工具链 | DevEco Studio 26.0.0.865 / HarmonyOS SDK 26.0.0.105 / API 26 |
| 未签名构建 | `tools/build-hap.ps1` 成功，8.709 秒，33 tasks；[原始构建日志](assemble-hap.log) |
| 首次安装 | 未签名 HAP 被真机拒绝，`9568320: no signature file`；[失败记录](install-unsigned.log)。HDC 退出码仍为 0，因此本轮依据设备返回内容判定，未把退出码当成安装成功 |
| 调试签名 | 设备持有人在独立临时工程的 DevEco Signing Configs 中生成签名；本地将 `default` product 关联相应 signingConfig。账号操作由持有人完成 |
| 签名构建 | 成功，11.203 秒，33 tasks；[安全摘要](signed-build-summary.txt)。完整签名构建日志只留本机 |
| 已安装 HAP | `entry-default-signed.hap`，162907 bytes，SHA-256 `C5C064FC587AD71577035380470A7ECD5049F0776492871FE75E36BA54922912`；这是本机安装产物的哈希，未从设备回读 HAP |
| 安装与启动 | 明确返回 `install bundle successfully` 和 `start ability successfully`；[安装](install-signed.log)、[启动](start-entry.log)。随后日志出现 `page_loaded`，并从 UI 树读取到本 Demo 的实际控件和返回值 |
| 已安装模块 | 设备包管理器返回 `phone/tablet/2in1`、`EntryAbility`、`AgentExtensionAbility` 注册；[模块摘录](installed-module.json)。注册不等于扩展组件真实连接成功 |

构建命令：`./tools/build-hap.ps1 -DevEcoRoot <本机 DevEco 根目录>`。签名构建在独立临时工程内执行同一脚本，仓库 `build-profile.json5` 保持无签名配置；密钥、证书、Profile、密码和签名 HAP 均不入库。重新构建可能得到不同 HAP 哈希，应分别登记环境与产物。

## MateBook 真机结果

所有点击均在重新读取 Demo 所属 UI 树后，按当前控件位置操作；每笔运行前核对输入框实际文本。首次布局捕获尚未读取到 Demo，后来重新启动并重取布局后确认页面已显示，初次捕获不计入成功证据。原始全桌面布局及截图只留本机，仓库保存本 Demo 的输入、结果、日志摘录和裁剪窗口截图。

| 项目 | 实际结果 | 证据 |
| --- | --- | --- |
| F02 安装/页面操作 | 签名 HAP 在 MateBook 真机安装、启动、控件操作成功 | 安装/启动记录与后续各笔 UI 结果 |
| F03 `回显 你好，鸿蒙` | `g1-echo / success / text=你好，鸿蒙 / in-app`；5 个业务阶段、恰好一次最终返回 | [UI 结果](F03.json) |
| F04 `长度 你好ABC` | `g1-text-length / success / length=5 / utf16-code-unit / in-app`；5 个业务阶段、恰好一次最终返回 | [UI 结果](F04.json) |
| F06 `查天气` | `ERR_NO_SKILL`；3 个阶段，无 `skill_started`，恰好一次最终返回 | [UI 结果](F06.json) |
| F08/F09 运行时自检 | 9/9 项通过：抛错转换 `ERR_INTERNAL`，超时 `ERR_TIMEOUT`，50ms 返回，迟到结果不改写、不重试，底层完成 1 次；正常对照通过 | [完整自检结果](F08-F09.json)、[Demo 窗口截图](selfcheck-window.png) |

同 requestId 的日志见 [运行时摘录](runtime-trace.jsonl)（21 条业务/自检事件），[汇总](ui-results.json)。F08/F09 使用 C 已交付的独立测试替身，`executionPath=self-check`；其余业务为 `in-app`。本轮没有修改 C 的执行器或正式样例业务。

## 本机检查及交接

- 结构/链接检查通过；A 入口 32 项和当前共享核心 28 项通过，见 [入口检查日志](a-entry.log)。旧自测末行仍印有“23 shared core checks”，实际本轮输出为 28 项；本轮未修改历史检查器。
- 给 D：新增的是 MateBook `2in1` 真机的安装/启动和上述应用内冒烟证据，按该源码版本接收即可。本轮没有代改验收表、设备排期或交付索引；不覆盖 D 的 Pura 70 记录。
- A01/A03：扩展组件仅确认注册和本地既有桥接检查，真实受支持调用方、认证和回调仍未验证。
- S01/S02/A02/E01：本轮没有系统发现、系统脚本执行或自建 Agent 主动发起调用证据；桌面 Demo 运行不能代替这些路径。系统调用仍需受支持的平台接入方式、调用方和资格。
- 按用户本轮要求，未重做剩余模拟器用例，也未在 MateBook 上宣称 F05/F07/F10 全量通过；D 最新 PR #13 已另有 Pura 70 真机记录。

证据哈希见 [manifest.json](manifest.json)。本轮结论：MateBook 真机适配、签名安装和应用内冒烟测试通过；系统 Agent/Skill 目标路径仍未验证。
