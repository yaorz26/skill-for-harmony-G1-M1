# D 当前集成版补测：F07 与 F10

执行人：唐欣卓 / `pourf`。日期：2026-11-06。本轮继续在 [D 首轮验收](../2026-11-06-D-acceptance/report.md)的同一 API 26 **模拟器**上，对已安装的同一未签名 HAP 补测。源码仍为干净的 `main@ab9691fda02a87c40cc162b166128b1a4d37aa46`；HAP 123267 字节，SHA-256 `7A15C589E766ED2EB385C2633048A3A99BE3A1E573771C8696739EC35293169C`。本轮没有重新构建或安装，也没有修改应用实现。

## 操作与结果

从应用页面输入，用 DevEco 自带 HDC 的 `uitest uiInput` 点击、选中并替换输入；每次先用 `dumpLayout` 核对 TextInput 的实际文本，再点“运行”。结果与日志按 requestId 关联。模拟器型号、系统/API、安装和启动命令见[首轮报告](../2026-11-06-D-acceptance/report.md)。原始页面布局、截图、日志分别存于 [layouts](layouts/)、[screenshots](screenshots/)、[traces](traces/)；便读提取见 [results.json](results.json)，其中 512 个 emoji 的回包文本压缩为计数，完整文本仍在原始布局；SHA-256 见 [manifest](manifest.json)。

| 用例 | 实际输入 | requestId | 结果与判定 | 证据 |
| --- | --- | --- | --- | --- |
| F07 缺参 | `回显`，输入框 2 码元 | `ui-1793958066820-1` | failed / `ERR_INVALID_PARAMS` / `skillId=g1-echo`；3 段日志，无 `skill_started`；**通过** | [布局](layouts/F07-noarg.json)、[截图](screenshots/F07-noarg.jpeg)、[日志](traces/F07-noarg.txt) |
| F07 空输入 | 输入框长度 0 | `ui-1793958192725-2` | failed / `ERR_INVALID_PARAMS` / 空 `skillId`；2 段日志；**通过** | [输入](layouts/F07-empty-input.json)、[结果](layouts/F07-empty.json)、[截图](screenshots/F07-empty.jpeg)、[日志](traces/F07-empty.txt) |
| F07 参数超限 | `回显 `+1025 个 `a`，总长 1028 码元 | `ui-1793958406663-5` | failed / `ERR_INVALID_PARAMS` / `skillId=g1-echo`；3 段日志；**通过** | [输入](layouts/F07-1025-input.json)、[结果](layouts/F07-1025.json)、[截图](screenshots/F07-1025.jpeg)、[日志](traces/F07-1025.txt) |
| F07 总长超限 | 1101 个 `a` | `ui-1793958462150-6` | failed / `ERR_INVALID_PARAMS` / 空 `skillId`；2 段日志；**通过** | [输入](layouts/F07-1101-input.json)、[结果](layouts/F07-1101.json)、[截图](screenshots/F07-1101.jpeg)、[日志](traces/F07-1101.txt) |
| F07 纯空格 | 5 个空格 | `ui-1793958518554-7` | failed / `ERR_INVALID_PARAMS` / 空 `skillId`；2 段日志；**通过** | [输入](layouts/F07-spaces-input.json)、[结果](layouts/F07-spaces.json)、[截图](screenshots/F07-spaces.jpeg)、[日志](traces/F07-spaces.txt) |
| F07 emoji 512 边界 | `长度 `+512 个 😀；输入框 1027 码元，参数 1024 码元 | `ui-1793959229387-8` | `g1-text-length` / success / `data.length=1024` / `utf16-code-unit`；返回文本含 512 个 😀，5 段日志；**通过** | [固定输入](fixtures/length-512-emoji.txt)、[输入](layouts/F07-512-input.json)、[结果](layouts/F07-512.json)、[截图](screenshots/F07-512.jpeg)、[日志](traces/F07-512.txt) |
| F07 emoji 513 边界 | `长度 `+513 个 😀；输入框 1029 码元，参数 1026 码元 | `ui-1793971711830-9` | failed / `ERR_INVALID_PARAMS` / `skillId=g1-text-length` / 空 `data`；3 段日志，无 `skill_started`；**通过** | [固定输入](fixtures/length-513-emoji.txt)、[输入](layouts/F07-513-input.json)、[结果](layouts/F07-513.json)、[截图](screenshots/F07-513.jpeg)、[日志](traces/F07-513.txt) |
| F10 第一笔 | `回显 first` | `ui-1793958242826-3` | success / `data.text=first` / in-app；5 段日志；**通过** | [布局](layouts/F10-first.json)、[截图](screenshots/F10-first.jpeg)、[日志](traces/F10-first.txt) |
| F10 第二笔 | `回显 second` | `ui-1793958293219-4` | success / `data.text=second` / in-app；5 段日志；**通过** | [输入](layouts/F10-second-input.json)、[结果](layouts/F10-second.json)、[截图](screenshots/F10-second.jpeg)、[日志](traces/F10-second.txt) |

F10 两笔 requestId 不同，结果分别为 `first` / `second`。各自日志均依次包含 `request_received`、`intent_matched`、`skill_started`、`skill_finished`、`response_returned`，各有且仅有一条最终返回；未发现两笔数据串包。这是应用内顺序请求测试，不替代 A03 的外部入口并发/重复 ID 验收。

## emoji 输入方法与失败尝试

起初尝试宿主剪贴板生成 512 个 emoji，但模拟器粘贴后设备 TextInput 仍为 `回显 second`（[失败布局](layouts/F07-512-paste-failed.json)）。HDC `uitest uiInput text` 直接通过命令参数传入 😀 会变成两个 `?`（[失真布局](layouts/F07-emoji-injection-failed.json)）。这些输入未运行，也没有记为业务失败。

有效方法：在宿主以 UTF-8 无 BOM 写入[512](fixtures/length-512-emoji.txt)和[513](fixtures/length-513-emoji.txt)固定输入，使用 `hdc file send` 传到设备 `/data/local/tmp/`，然后**只在 ASCII 命令中**让设备 shell 读取文件：

```powershell
& $hdc -t 127.0.0.1:5555 file send '<固定输入文件>' /data/local/tmp/g1m1-emoji.txt
& $hdc -t 127.0.0.1:5555 shell 'uitest uiInput text "$(cat /data/local/tmp/g1m1-emoji.txt)"'
```

实际操作先在输入框长按、全选，再执行上面的 `uitest` 命令。设备端 `dumpLayout` 分别确认 `长度 ` 前缀、512/513 个真 😀 以及 1027/1029 码元，之后才点击“运行”。这避免了 HDC 命令参数传输失真。两条精确输入在**当前 HAP**均已按预期通过；C 旧版 `字数 `别名结果仍独立保留。

## IDE 同步与目标路径边界

本轮尝试启动本机 DevEco Studio，但未出现可操作的 IDE 窗口，本机 `idea.log` 也没有新同步记录；[环境检查](ide-sync-attempt.txt)记录了观察时间与日志时间。因此 F01 的 IDE 同步子项仍未验证；已有命令行未签名 HAP 构建结论保持不变。

这轮只覆盖应用内规则与执行器。系统发现、Skill 入口、系统结果上报、AgentExtensionAbility 真实回调、真机签名安装和端到端目标路径均未测。业务处理没有新 Ability 启动。
