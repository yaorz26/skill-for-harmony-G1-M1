# D：S01/S02 小艺真机系统 Skill 验收

日期：2026-11-07。设备：HUAWEI Pura 70，HarmonyOS `7.0.0.111` / API 26；小艺 `11.7.8.339`。工程与安装包沿用[平台导入记录](../2026-11-07-D-platform/report.md)的固定源码 `ab9691f` 和调试签名 HAP（SHA-256 `AE81F666F362D7176E8390296F749EF178C6D5C0DE59B18D99FED40006DF8B20`）。

## 入口与复测方法

小艺开放平台的真机测试提示列出三项设备校验：HarmonyOS 7、小艺 11.7.x 或以上、小艺主对话显示“Skill真机测试中”快捷方式。HDC 读取系统和小艺版本满足前两项；本轮在小艺主对话看到了并启用了该快捷方式。此前[发布后初测](../2026-11-07-D-platform/report.md)没有确认这一入口，且仅根据最终回复判断，故保留原始失败记录，不把那轮错误结果改写为成功。

通过 HDC 的 `uitest uiInput` 在小艺主对话发送以下两条新请求；截图保存可见输入、执行过程和最终回复。`hilog -x` 按时间、目标 Skill 和入口标记筛出相关行，未保存无关个人对话。

| 用例 | 输入 | 小艺最终回复 | 系统调用与业务结果 | 判定 |
| --- | --- | --- | --- | --- |
| S01/S02 回显 | `回显 T8P2-鸿蒙-47` | `T8P2-鸿蒙-47` | 小艺 `execCli2` 点名 `g1-echo`，系统调度至 `skills/g1-echo/scripts/EchoSkill.ets`；`requestId=7` 的 `system_skill_entered`、`system_result_reported` 均出现；`stdOut` 为 `success`、`system-skill`，文本一致 | 通过 |
| S01/S02 长度 | `长度 a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0😀` | `42` | 小艺 `execCli2` 点名 `g1-text-length`，系统调度至 `skills/g1-text-length/scripts/TextLengthSkill.ets`；`requestId=6` 的 `system_skill_entered`、`system_result_reported` 均出现；`stdOut` 为 `success`、`system-skill`、`length=42`、`unit=utf16-code-unit` | 通过 |

长度输入由 40 个 ASCII 码元和 1 个占 2 个 UTF-16 码元的 emoji 组成，预期 `42`。两笔请求的 `requestId` 不同，分别关联对应脚本、业务结果和上报。系统日志还记录了 `replyCliResult`，可追踪到小艺收到的结果包。界面展开后分别显示“调用回显文本”或“调用文本长度”及“执行任务”。

证据：[回显日志](echo-hilog.txt)、[回显过程与结果截图](echo-expanded.jpeg)、[长度日志](length-hilog.txt)、[长度过程截图](length-expanded.jpeg)、[长度最终结果截图](length-clean.jpeg)。截图只包含本项目的测试对话；没有保存账号、证书或签名材料。

## 无效参数路径尝试与限制

按[验收手册](../../acceptance-runbook.md)的 S02 条件，又尝试了一个错误参数：`长度 ` 后接 513 个 `😀`。本地生成文件含 513 个 emoji，参数占 1026 个 UTF-16 码元，超出 Skill 的 1024 限制；输入文件 SHA-256 为 `DE1477F09825457759AEA53405437C230FC300A9CBEC4E3C582C04D8D69A663A`。本次在小艺新话题发送后，界面只按“200 个字符”作答；同轮当前缓冲区未发现 `g1-text-length` 的调度、入口或结果日志。[尝试截图](invalid-attempt.jpeg)仅证明该轮没有走到可关联的系统 Skill 错误分支，不作为业务校验通过证据。不能推断是小艺输入限制还是模型自行截取；需要平台提供能把无效参数传入脚本的正式测试入口才能验收这一分支。

**本轮结论：S01、S02 均已验证。**S01 两项 Skill 的系统发现与匹配通过；S02 两项正常调用的脚本执行、业务结果、上报与小艺最终回复通过。本轮验收范围据后续决定限定为正常调用；上文的无效参数尝试没有进入脚本，该分支仍是“未验证”，不补测且不作为本轮 S02 收口条件。此结论限于小艺作为系统调用方；没有验证自建 Agent 主动发起系统 Skill 调用的 A02，也没有验证外部 `AgentExtensionAbility` 回调或完整 E01 路径。
