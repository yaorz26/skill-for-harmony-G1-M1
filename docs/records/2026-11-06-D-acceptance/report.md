# D 固定版本模拟器验收记录（2026-11-06）

执行人：唐欣卓 / `pourf`。本轮接收 [A 的装配交接](../2026-11-06-A-integration.md)，独立重建并运行合入后的 `main@ab9691fda02a87c40cc162b166128b1a4d37aa46`。本轮只验证 API 26 **模拟器**上的应用内路径与执行器测试替身，不代表真机或系统 Skill 验收。

## 固定对象与环境

| 项目 | 实际值 |
| --- | --- |
| 源码 | 干净的 `main@ab9691f` 英文路径临时克隆；D 的文档修改未进入被测 HAP |
| HAP | `entry-default-unsigned.hap`，123267 字节，SHA-256 `7A15C589E766ED2EB385C2633048A3A99BE3A1E573771C8696739EC35293169C`；本轮本机重建，与 A 在 `3d89c6b` 构建的哈希不同 |
| 构建 | DevEco Studio 26.0.0.851，SDK API 26；`tools/build-hap.ps1 -DevEcoRoot <本机 DevEco 目录>`；34 项任务，`BUILD SUCCESSFUL`，未配置签名；[构建摘要](build-summary.txt) |
| 设备 | 本机 DevEco 模拟器 `Mate 90 Pro PHONE_api26`，HDC `127.0.0.1:5555`，`const.ohos.apiversion=26`，`const.ohos.fullname=OpenHarmony-7.0.0.105`；非真机；[环境与命令返回](environment.txt) |
| 调用方 | 应用页面 `EntryAbility`；无外部 Agent、系统调用方或额外权限测试 |
| 网络 | 两个固定无网络样例；未测试联网能力 |
| 证据 | [结构化结果](results.json)、[布局](layouts/)、[截图](screenshots/)、[请求日志](traces/)；文件哈希见 [manifest](manifest.json) |

DevEco IDE 的“同步”操作没有单独留证，F01 只判定命令行构建子项。HAP 未纳入仓库；其哈希和固定源码足以供收到同一构建环境的成员复核，产物字节不保证跨机器一致。

另运行 `node tools/run-acceptance.mjs` 的[主机检查](host-checks/summary.md)：结构、共享核心、A 入口、C 执行器、证据工具五组退出码均为 0，源码指纹在检查期间未变化。该命令针对含 D 未提交文档的工作树，源代码 commit 仍为 `ab9691f`；仅作主机检查，不用于推断设备行为。

## 操作与逐项结果

英文路径克隆该 commit，执行 `tools/build-hap.ps1`；用 DevEco 自带 `hdc.exe` 选择 `127.0.0.1:5555`，运行 `app install <HAP>`，返回 `install bundle successfully`。模拟器完成启动后执行 `shell aa start -a EntryAbility -b com.g1m1.skillagent`，返回 `start ability successfully`，页面可操作。首轮启动时屏幕尚锁定，启动命令失败；等待开机完成并重试后成功，此轮没有把首轮当成应用故障。UI 通过 `uitest dumpLayout`、`uiInput click` 操作；emoji 从宿主剪贴板粘贴，先核对[输入布局](layouts/F05-input.json)的 `长度 😀`，再点击运行。HDC 命令行文字注入不作为 emoji 输入证据。

| 用例 | 实际输入 / 操作 | requestId | 实际结果与判定 | 原始证据 |
| --- | --- | --- | --- | --- |
| F01 构建 | 当前 commit 的 `assembleHap` | — | **命令行构建通过**；IDE 同步未单独核验 | [摘要](build-summary.txt) |
| F02 安装与启动 | 未签名 HAP 安装模拟器，启动页面 | — | **模拟器通过**；非签名真机安装 | [命令返回](environment.txt)、[页面截图](screenshots/F03.jpeg) |
| F03 | `回显 你好，鸿蒙` | `ui-1793956547946-2` | `g1-echo` / success / `你好，鸿蒙` / in-app；五段日志，**通过** | [布局](layouts/F03.json)、[截图](screenshots/F03.jpeg)、[日志](traces/F03.txt) |
| F04 | `长度 你好ABC` | `ui-1793956554223-3` | `g1-text-length` / success / length=5 / utf16-code-unit；五段日志，**通过** | [布局](layouts/F04.json)、[截图](screenshots/F04.jpeg)、[日志](traces/F04.txt) |
| F05 | **`长度 😀`** | `ui-1793956416591-1` | text=`😀` / length=2 / utf16-code-unit；五段日志，**通过**。此处补齐 C 旧记录使用 `字数 😀` 的验收输入差异 | [输入](layouts/F05-input.json)、[结果](layouts/F05.json)、[截图](screenshots/F05.jpeg)、[日志](traces/F05.txt) |
| F06 | `查天气` | `ui-1793956560667-4` | failed / `ERR_NO_SKILL` / `skillId=""` / `data={}`；三段日志，无 `skill_started`，**通过** | [布局](layouts/F06.json)、[截图](screenshots/F06.jpeg)、[日志](traces/F06.txt) |
| F08 | 点“执行器自检 F08/F09”，抛错替身 | `self-check-1793956165647` | `ERR_INTERNAL`，调用 1 次，**通过** | [布局](layouts/F08-F09.json)、[截图](screenshots/F08-F09.jpeg)、[日志](traces/F08-F09.txt) |
| F09 | 同一次自检，慢速替身与迟到结果 | 同上 | `ERR_TIMEOUT`，调用 1 次，迟到后仍超时；9/9 自检项含对照组均通过，**通过** | 同上 |

F03–F06 均为页面 → AgentService → 规则路由 → SkillExecutor → `InAppSkillInvoker` → 应用业务 → 页面回包。F08/F09 是独立 `ExecutorSelfCheck` 注入替身的 `self-check` 路径；测试了异常、超时、迟到隔离，不证明系统 Skill 调用。以上业务请求没有新 Ability 启动；F02 的 `EntryAbility` 启动只用于页面启动。

## 版本边界与未完成项

- F07、F10 在 [C 的 `2cde598` 模拟器报告](../2026-11-06-C-emulator/run-report.md)中已有结果，本轮 `ab9691f` **未重跑**。C 的 F07 边界输入使用 `字数 ` 别名，本轮也没有补测规范中的 `长度 `+512/513 个 emoji。验收表须保留这个精确输入缺口。
- S01/S02、A01/A03、E01：本轮无真机、受支持系统/扩展组件调用方及真实回调，未测。A02：C 尚未核实可用的应用主动发起系统 Skill 公共 API，真实适配器未交付，维持阻断。`in-app` 结果不可代替这些路径。
- 当前没有真机签名安装、系统发现/执行、系统结果上报、扩展组件生命周期或端到端录屏证据。测试页面截图已保存；没有录屏。后续收到对应固定版本与设备后，另建报告复测。
- 复核 C 的两个既有证据包时，原始 manifest 的 6 个 SHA-256 在 Git LF 检出后不匹配：C 模拟器包 4 个、自检包 2 个。六个文件仅把 LF 还原为 CRLF 后可与原哈希匹配，属于行尾归一化导致的字节复现问题，内容判定未因此翻转；见[证据问题单](manifest-issue.md)。不修改 C 的原始记录。

## 复现命令与判定

```powershell
$hdc = '<DevEco Studio>\sdk\default\openharmony\toolchains\hdc.exe'
& $hdc list targets
& $hdc -t 127.0.0.1:5555 shell 'param get const.ohos.apiversion'
& $hdc -t 127.0.0.1:5555 app install '<本轮 HAP>'
& $hdc -t 127.0.0.1:5555 shell 'aa start -a EntryAbility -b com.g1m1.skillagent'
& $hdc -t 127.0.0.1:5555 shell 'uitest dumpLayout -p /data/local/tmp/g1m1.json'
& $hdc -t 127.0.0.1:5555 shell hilog -x
```

逐项判定依据 [D 验收手册](../../acceptance-runbook.md) 和 [接口 v0](../../interfaces.md)。布局 JSON 是设备导出的原始 UI 树，`results.json` 是从其中提取的便读副本；五份 `traces/` 为同 requestId 的 `[G1M1]` 日志摘录。所有截图和结果只含固定测试输入，已检查无账号或设备序列号。
