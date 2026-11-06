# 运行 / 实验报告：2026-11-06-C-emulator-01

## 1. 目标与环境

| 字段 | 实际值 |
| --- | --- |
| 用例编号 | F02、F03、F04、F05、F06、F07（7 个输入变体）、F10（应用内路径，模拟器口径） |
| 日期 / 执行人 / 复核人 | 2026-11-05 晚 – 11-06 上午 / C 李竞宇 `lijingyuu`（uitest 自动化 + 剪贴板人工粘贴配合） / 待 D |
| 工程分支 / commit / HAP | `main@2cde598`（worktree `D:\LJY\grade3\curriculum\g1m1-verify` 构建）；`entry-default-unsigned.hap` 109482 字节 |
| HAP SHA-256 | `F690F763AFADF04B0A9F22D7678DB5E347B0F7E455D9997BBDB9F40D7AD2EDA7` |
| 版本说明 | 构建后 `main` 推进到 `4191bcb`（D 的 PR #6），变更仅 `docs/`、`tools/`、`.github/`，未触及 `entry/` 应用源码，对运行行为无影响 |
| DevEco / Hvigor / SDK | 26.0.0.865（build 261.23567.138.36.2600865）/ 6.26.9 / 26.0.0.105 |
| 模拟器还是真机 / 型号 / 系统版本 | **模拟器**（非真机）。DevEco Emulator 26.0.0.402，实例 `Phone_API26`（Pura X View，1320×2232@480dpi，4 核 / 4GB RAM / 6GB 存储，WHPX 加速）；`emulator 7.0.0.107(SP8DEVC00E999R4P11)`，`const.ohos.apiversion = 26` |
| 调用方、入口与权限条件 | 应用内页面入口（`aa start -a EntryAbility -b com.g1m1.skillagent`），无外部调用方、无组件连接 |
| 网络、应用前后台等条件 | 离线；应用前台；输入注入走 `uitest uiInput`（ASCII）与宿主剪贴板粘贴（emoji）；模拟器镜像/数据位于 `D:\Huawei\Emulator\` |
| 验证路径 | in-app（全部请求 `executionPath="in-app"`，无 system-skill / 组件路径） |

环境证据：[targets.txt](environment/targets.txt)、[software_version.txt](environment/software_version.txt)、[apiversion.txt](environment/apiversion.txt)。全部证据文件 SHA-256 见 [manifest.txt](manifest.txt)。

## 2. 步骤与结果

输入方式：`示例按钮`＝页面自带快捷样例（uitest 点击）；`注入`＝`uitest uiInput inputText`（ASCII 可靠）；`粘贴`＝宿主剪贴板 → 输入框长按粘贴（emoji 唯一可靠通道，见 §4 工具链限制）。

| 次数 | 用例 / 输入 | 方式 | requestId | 预期 | 实际 | 判定 | 证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | F02：`hdc app install` 未签名 HAP + `aa start` | 命令行 | — | 安装成功、页面启动 | `install bundle successfully`；`start ability successfully`；页面加载并输出 | ✅ | §5 复现命令；页面截图 |
| 2 | F03：`回显 你好，鸿蒙` | 示例按钮 | ui-…366833-1 | success / g1-echo / text 一致 | 一致（5 段日志） | ✅ | [F03.txt](traces/F03.txt)、[F03.jpeg](screenshots/F03.jpeg) |
| 3 | F04：`长度 你好ABC` | 示例按钮 | 见日志 | success / length=5 / utf16-code-unit | 一致（5 段） | ✅ | [F04.txt](traces/F04.txt) |
| 4 | F05：`字数 😀` | **粘贴（真 emoji）** | ui-…866321-2 | success / length=2 | 一致（5 段）；输入框实况 `字数 😀` | ✅ | [live-g1m1.txt](traces/live-g1m1.txt)、[F05-paste.json](layouts/F05-paste.json)、[F05-paste.jpeg](screenshots/F05-paste.jpeg) |
| 5 | F06：`查天气` | 示例按钮 | 见日志 | failed / ERR_NO_SKILL / 无 skill_started | 一致（3 段） | ✅ | [F06.txt](traces/F06.txt) |
| 6 | F07-空：清空输入后运行 | 注入流程 | 见日志 | failed / ERR_INVALID_PARAMS / skillId 空 | 一致（**2 段**，入口拒） | ✅ | [F07a.txt](traces/F07a.txt) |
| 7 | F07-纯空格：5 个空格 | 注入 | 见日志 | ERR_INVALID_PARAMS | 一致（**2 段**，入口拒，`skillId=""`）——注意不是 ERR_NO_SKILL：纯空白初检先于意图匹配 | ✅ | [F07-space.txt](traces/F07-space.txt) |
| 8 | F07-缺参：`回显` | 注入 | 见日志 | failed / ERR_INVALID_PARAMS / skillId=g1-echo | 一致（3 段，无 skill_started） | ✅ | [F07-echo-noarg.txt](traces/F07-echo-noarg.txt) |
| 9 | F07-超限参数：`回显 `+`a`×1025 | 注入 | 见日志 | failed / ERR_INVALID_PARAMS / skillId=g1-echo | 一致（3 段） | ✅ | [F07-1025a.txt](traces/F07-1025a.txt) |
| 10 | F07-超限总长：`a`×1101 | 注入 | 见日志 | failed / ERR_INVALID_PARAMS / skillId 空 | 一致（**2 段**，入口拒，早于意图匹配） | ✅ | [F07-1101a.txt](traces/F07-1101a.txt) |
| 11 | F07-边界 512：`字数 `+512×😀（参数 1024 码元） | **粘贴（真 emoji）** | ui-…4915719-15 | success / length=1024 | 一致（5 段完整） | ✅ | [live-g1m1.txt](traces/live-g1m1.txt)、[F07b-rerun.json](layouts/F07b-rerun.json)、[F07b-rerun.jpeg](screenshots/F07b-rerun.jpeg) |
| 12 | F07-边界 513：`字数 `+513×😀（参数 1026 码元） | **粘贴（真 emoji）** | ui-…462177-14 | failed / ERR_INVALID_PARAMS | 一致（3 段，无 skill_started） | ✅ | [live-g1m1.txt](traces/live-g1m1.txt)、[F07c-paste.json](layouts/F07c-paste.json)、[F07c-paste.jpeg](screenshots/F07c-paste.jpeg) |
| 13 | F10：`回显 first` → 清空 → `回显 second` | 注入 | ui-…-21 / ui-…-22 | requestId 不同、各自 text 正确、不串包 | `first`/`second` 各自正确（各 5 段完整） | ✅ | [F10-redo.txt](traces/F10-redo.txt)、[F10-redo.jpeg](screenshots/F10-redo.jpeg) |

首轮自动化（11-05）中 F05/F07 边界曾因 emoji 经 `hdc` argv 传参失真为 `?`，仅作过程记录（[F07b.txt](traces/F07b.txt)、[F07c.txt](traces/F07c.txt) 为该轮日志），**上表第 4/11/12 行的粘贴轮为最终有效证据**；`1024×?` 放行 / `1026×?` 拒绝与 emoji 轮数值互相印证。

### 链路状态机口径（供 B/D 对表）

- **2 段**（request_received → response_returned）：入口初检拒（空输入 / 纯空白 / 总长 >1100），`skillId=""`。
- **3 段**（+ intent_matched，无 skill_started）：路由命中后参数校验拒（缺参 / 参数超限），保留命中 `skillId`；未命中为同形态但 `ERR_NO_SKILL`。
- **5 段**（+ skill_started / skill_finished）：成功。
- 每请求恰有一条 `response_returned`；全程 `executionPath="in-app"`。

### 追加观察（完整日志见 live-g1m1.txt，如实留档）

- 10:15:54–10:17:00 出现 7 次超限输入被连续拒绝（清场脚本坐标误触运行按钮、输入框残留超长内容）——7 次全部 `ERR_INVALID_PARAMS`，连续触发下无一次漏放。
- 夜间（约 00:36）另有 2 次超限拒绝记录（-4/-5），无对应页面证据，未归因，仅留档。
- 10:17:22 一次 `回显` 成功运行（-13，示例按钮触发），属清场期间操作。
- 全程无崩溃；首轮自动化中 2 次 `aa force-stop`+重启仅用于清空超长输入（工具操作，非应用故障）。

## 3. 分阶段判定

| 阶段 | 判定 | 证据与解释 |
| --- | --- | --- |
| 构建 | 通过 | [2026-11-05 构建记录](../2026-11-05-C-runtime/build-record.md)；本记录 HAP 为 `2cde598` 重建（§1） |
| 安装 | 通过（模拟器） | 未签名 HAP 直接 `hdc app install` 成功（模拟器免签口径） |
| 应用内运行 | 通过 | 13 个输入变体全部符合预期；无崩溃 |
| Agent 扩展组件回调 | 不适用 | 本轮无外部调用方连接（A01 未测，待 A 与真机） |
| 应用规则匹配 | 通过 | 命中/未命中/边界全路径与 [interfaces.md](../../interfaces.md) 一致 |
| 系统发现 / 匹配 Skill | 未测 | 模拟器无系统 Agent 入口；官方端侧调试需真机白名单（[API 调研](../2026-11-05-C-runtime/api-research.md)） |
| 实际 Skill 入口执行 | 未测 | 同上（S01/S02 待真机） |
| 业务 / Ability 调用 | 通过（业务复用） | 全部请求走 `AppSkillService` 应用内业务；**无新 Ability 启动**（EntryAbility 启动仅一次，作 F02 页面启动证据，不充当业务调用证据） |
| 结果上报与最终返回 | 部分 | `response_returned` 全部呈现；`system_result_reported` 不适用（无 system-skill 路径） |
| 端到端 | 部分（应用内段） | 页面 → AgentService → 路由 → 执行 → 返回 全通；组件段 / 系统 Skill 段未测 |

## 4. 结论、阻断与后续

1. **F02–F07、F10 应用内路径：模拟器运行时全部通过**（13 个输入变体，含 512/513 真 emoji 边界与 F10 双请求不串包）。D 可按“模拟器通过（非真机）”更新验收表对应行；真机栏仍待真机证据。
2. **工具链限制（方法学记录）**：`hdc shell` argv 无法传 emoji（U+1F600 失真为两个 `?`，bash/PowerShell/Node 三通道一致）；解决路径为宿主剪贴板粘贴。事后 `hilog -x` 导出在输入法高频日志下可能被环形缓冲冲掉（F07b 首轮即如此），关键轮次应使用实时流采集。
3. **F08/F09 鸿蒙运行时入口（回应 D 的要求）**：提议在演示页增加“自检”入口——运行时构造独立 `SkillExecutor` 实例并注入测试替身（抛错 / 超时 / 迟到），**不触碰正式样例业务、不留故障开关**，输出与 [check-executor.mjs](../2026-11-05-C-runtime/check-executor.mjs) 同口径的判定。页面归 A 维护、验收口径归 D：待 A/D 批准后实现；批准前 F08/F09 运行时栏维持“阻断（无测试入口）”。
4. **S01/S02 与系统路径**：模拟器无法验证，维持真机待约（设备表 C 行）；组内暂无确认的 API 26 真机。
5. **无隐私输入**：全部输入为固定测试样例，无脱敏需求。

## 5. 复现

```powershell
# 模拟器（镜像/数据在 D:\Huawei\Emulator\；首装流程见 2026-11-05-C-runtime/build-record.md 的环境说明）
& "D:\Huawei\DevEco Studio 26.0.0\tools\emulator\Emulator.exe" -start Phone_API26

$hdc = "D:\Huawei\DevEco Studio 26.0.0\sdk\default\openharmony\toolchains\hdc.exe"
& $hdc list targets                       # 127.0.0.1:5555
& $hdc app install <HAP路径>              # 未签名，模拟器免签
& $hdc shell "aa start -a EntryAbility -b com.g1m1.skillagent"

# UI 驱动与取证
& $hdc shell "uitest dumpLayout -p /data/local/tmp/l.json"   # 解析 bounds 定位按钮/输入框
& $hdc shell "uitest uiInput click <x> <y>"
& $hdc shell "uitest uiInput inputText <x> <y> <ASCII文本>"  # emoji 必须走宿主剪贴板粘贴
& $hdc shell "uitest screenCap -p /data/local/tmp/s.jpeg"
& $hdc shell hilog -x                     # 事后导出；关键轮次建议 `hdc shell hilog` 实时流落盘
```

证据结构：`traces/`（各用例 `[G1M1]` 摘录 + 实时流全量）、`layouts/`（粘贴三轮的页面布局原文件）、`screenshots/`（5 张关键截图）、`environment/`（设备环境）、`manifest.txt`（全部文件 SHA-256）。
