# S01/S02：换一部华为手机复测小艺系统 Skill

本手册用于让另一位成员在自己的华为设备上复现回显和文本长度两项能力的**小艺系统调用**。先按第 1 节选定版本，再使用该版本的包名、平台注册名和脚本路径。已通过的 Pura 70 实例与原始证据见[2026-11-07 真机记录](records/2026-11-07-D-system-skill/report.md)。每部新设备仍需单独验收，不能直接沿用该结论。平台界面和支持范围可能变化，以[华为真机测试指南](https://developer.huawei.com/consumer/cn/doc/doccenter-celia/skill-real-machine-testing-0000002592771628)及平台当前提示为准。

本轮按[已有成果和状态收尾](records/2026-11-08-A-closeout/report.md)，不要求追加手机实验。以下步骤供后续恢复测试或换设备复现使用。

## 1. 先记录这一轮使用的版本

在新的实验记录中写下工程 commit、签名 HAP 的 SHA-256、包名、设备型号、HarmonyOS 版本、小艺版本、测试账号是否在用户组，以及执行时间。只记录核对结果；不要把账号凭据、设备序列号、签名证书或密码放进仓库。

| 核对项 | D 手机已验证的历史基线 | A 当前整合交付 |
| --- | --- | --- |
| 应用源码 | `ab9691f` | `c7d23d7`；当前收尾分支沿用该应用源码，后续提交为文档和证据整理 |
| 应用包名 | `com.g1m1.skillagent` | `com.yaorz26.g1m1.skillagent` |
| 回显平台注册名 | `g1-echo` | `yaorz26-g1m1-echo-20261107` |
| 长度平台注册名 | `g1-text-length` | `yaorz26-g1m1-text-length-20261107` |
| 回显脚本路径（HAP / srcEntry） | `skills/g1-echo/scripts/EchoSkill.ets` | `skills/yaorz26-g1m1-echo-20261107/scripts/EchoSkill.ets` |
| 长度脚本路径（HAP / srcEntry） | `skills/g1-text-length/scripts/TextLengthSkill.ets` | `skills/yaorz26-g1m1-text-length-20261107/scripts/TextLengthSkill.ets` |
| 已有验证 | Pura 70 的 S01/S02 正常调用通过 | MateBook 应用内运行和自检通过；新包名的系统调用仍未验证 |

两版业务结果中的内部 `skillId` 都是 `g1-echo` / `g1-text-length`，它与平台注册名分别核对。A 版本的包名和平台注册名已变化，不能沿用 D 旧发布的系统调用通过结论。

核对待安装 HAP 与平台导入的 HAP 来自本轮选定的同一源码和包名。签名、测试组及平台发布也须与该版本对应；若使用其他账号或自行改名，以实际工程的 `AppScope/app.json5`、`entry/src/main/module.json5` 和 `entry/skills/*/SKILL.md` 为准，重新记录哈希并更新导入、配置及真机测试发布。两版固定 HAP 的哈希及证据见[A 最终交接](records/2026-11-08-A-closeout/report.md#固定版本与复现方式)。

## 2. 检查新设备和账号

1. 在手机“设置 → 关于本机”确认是 **HarmonyOS 7**。已成功的 Pura 70 是 `7.0.0.111` / API 26；这只是已测环境，不代表所有机型、补丁版本自动通过。
2. 在“小艺 App → 设置 → 关于小艺”确认版本为 **11.7.x 或更高**。已成功的设备是 `11.7.8.339`。
3. 确认手机的小艺已登录**本轮测试账号**。若换账号，需由有小艺开放平台权限的成员确认该账号已加入目标真机测试用户组。仅安装 Demo 或在桌面看到“Skill Agent Demo”，不能证明测试资格。
4. 在 DevEco Studio 为该设备准备能安装的**调试签名 HAP**，安装第 1 节本轮选定的应用包名。不同手机若不在当前调试 Profile 的设备范围内，应按 DevEco 的自动调试签名流程为新设备重新配置和构建。签名配置只保留在本机；安装后核对应用包名、版本与本轮记录一致。
5. 在小艺开放平台分别查看本轮选定的两项**平台注册名**：它们应关联本轮包名，选中同一真机测试用户组，且已发布到**小艺主对话真机测试**。如平台显示已过期或配置/HAP 已更新，按平台流程重新发布。测试发布有效期为 15 天；“草稿”上架状态与真机测试发布状态分别判断。

D 历史发布的用户组 `G1M1_Pura70_20261107` 只记录了原测试账号加入，不能直接套用于 A 的新包名发布。其他成员不要假设自己已在本轮组内；由平台管理者检查对应发布及成员状态，必要时添加测试账号或建立适用的新组，再确认两项 Skill 均发布到该组。

## 3. 找到正确的小艺测试入口

打开**小艺 App 主对话**，在输入框上方的快捷方式中找“**Skill真机测试中**”。点击该快捷方式，确认它处于启用状态，再发送测试请求。它是平台给出的环境就绪标志。若没有出现，依次复查第 2 节的系统/小艺版本、登录账号、用户组成员、两项 Skill 的发布状态与 15 天有效期；刷新或重启小艺后再看一次。不要在入口缺失时根据普通聊天回复判定 S01/S02 通过。

## 4. 两个最小正式用例

在小艺主对话依次发送，每条等到完成后再发下一条；测试串可替换为本轮新生成的非隐私短串，但预期值也要随之写明。

| 用例 | 输入示例 | 应看到的结果 |
| --- | --- | --- |
| 回显 | `回显 T8P2-鸿蒙-47` | 展开“已完成”过程，出现“调用回显文本”“执行任务”；最终回复原样为 `T8P2-鸿蒙-47` |
| UTF-16 长度 | `长度 a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0😀` | 展开过程，出现“调用文本长度”“执行任务”；最终回复 `42`，因为 40 个 ASCII 码元加 1 个占 2 码元的 emoji |

**最终回复正确只是初筛。**小艺可能直接用模型回显或心算。正式 S01/S02 还要按第 5 节核对系统调度、项目脚本入口、同一请求的上报与返回。若只显示“生成回复”，没有目标 Skill 的调度日志，记录为“未证明调用”，不要填通过。先前未进入测试路径的[失败记录](records/2026-11-07-D-platform/report.md)就是这种区分的原因。

S02 无效参数分支仍未验证，不列入本轮追加补测。后续若扩展验收范围，可在平台确认**允许传入无效参数的正式入口**后测试 `长度 ` 加 513 个 `😀`（参数占 1026 个 UTF-16 码元，应返回 `ERR_INVALID_PARAMS`），并按第 5 节核对系统入口与上报。Pura 70 的既有尝试只得到“200 个字符”的回复，没有调用日志；这不是错误分支通过。换设备也不能把长文本的模型回复当作脚本校验结果。

## 5. 采集系统证据

可用 DevEco 的设备日志窗口，或在已授权 USB 调试的电脑上使用华为 Command Line Tools 的 `hdc`。以下是 Windows PowerShell 示例，默认使用 A 当前版本的平台注册名；复现 D 的 `ab9691f` 历史基线时，将两项注册名改为表中的 `g1-echo` / `g1-text-length`。`hdc.exe` 路径改成测试者本机路径。使用前解锁手机并接受“允许 USB 调试”。

```powershell
$hdcTool = 'C:\path\to\hdc.exe'
$echoRegisteredName = 'yaorz26-g1m1-echo-20261107'
$lengthRegisteredName = 'yaorz26-g1m1-text-length-20261107'
$skillLogPattern = @($echoRegisteredName, $lengthRegisteredName,
  'g1-echo', 'g1-text-length', 'system_skill_entered',
  'system_result_reported', 'system_report_failed', 'replyCliResult') -join '|'
& $hdcTool list targets -v
& $hdcTool shell param get const.product.software.version
& $hdcTool shell hilog -x | Select-String -Pattern $skillLogPattern
```

`hilog -x` 读取当前缓冲区后退出；**发送每条请求后尽快采集**，以免日志被覆盖。日志可能含用户输入与其他应用信息，分享前只保留本轮测试相关行，检查截图顶部通知和私人会话，避免上传原始完整缓冲区。

每项至少核对以下同一轮链路，并保存截图、筛选后的日志与时间：

1. 小艺的 `execCli2` 含本轮**平台注册名**对应的 `skillName`、`ohos-arkTSScript` 命令、脚本路径和本轮输入；系统 `Dispatch to skill path` 指向该调用。
2. 本轮**应用包名**的 `UIAbility` 记录 `srcEntry`，分别指向第 1 节该版本的回显或长度脚本路径。
3. 项目 `[G1M1]` 日志中，同一 `requestId` 出现 `system_skill_entered` 和 `system_result_reported`，`executionPath` 为 `system-skill`。若有 `system_report_failed`，本项不能记通过。
4. 小艺 `stdOut` / `replyCliResult` 中的 `skillId`、`requestId`、`status: success` 与业务 `data` 对应，最终屏幕回复与该结果一致。两版返回的内部 `skillId` 仍为 `g1-echo` / `g1-text-length`，不替换成带账号前缀的平台注册名。两项请求的 ID 应分别关联，不拼接不同轮次的片段。

若日志没有上述关键行，先确认 HDC 已连接、取的是当前设备、采集发生在请求之后；再做**一次**同类新请求并立即读取日志。仍缺失时保留实际结果和失败节点，不依据模型文字补判通过。

## 6. 填写结论

为每部设备建立独立报告，列出：环境、HAP 哈希、平台测试组与发布状态、两条输入/最终回复、截图、同一请求的调度/脚本/上报日志，以及 S01/S02 各自通过或失败的理由。可仿照[本轮证据报告](records/2026-11-07-D-system-skill/report.md)。

小艺成功调用只证明**小艺 → 系统 Skill → 本应用脚本 → 小艺**这条链；A02 的“自建 Agent 主动调用系统 Skill”、A01/A03 外部组件回调和 E01 完整目标路径仍按各自验收条件单独测试。
