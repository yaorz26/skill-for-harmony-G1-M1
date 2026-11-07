# D 小艺开放平台导入与测试组记录

日期：2026-11-07。平台：小艺开放平台、HarmonyOS 开发者中心；使用当前登录账号。本文不记录账号标识、设备序列号或签名材料。

## 已完成

- 导入前，当前账号的 Skill 列表为 0 条，真机测试用户组列表为空。
- 将固定源码 `ab9691f` 构建的调试签名 HAP 导入小艺开放平台。文件 SHA-256：`AE81F666F362D7176E8390296F749EF178C6D5C0DE59B18D99FED40006DF8B20`；本地核对 `entry` 目录与当前 `main` 无差异。导入结果的成功列表分别列出 `g1-echo.zip` 和 `g1-text-length.zip`，错误列表为空；Skill 列表随后显示 2 条，状态均为“草稿”。
- 创建真机测试用户组 `G1M1_Pura70_20261107`，并通过“加入测试组”将当前账号加入。列表显示用户数 1、“当前账号是否在测试组”为“是”。
- 当前账号的 HarmonyOS 开发者中心原先显示 HarmonyOS 应用数 0；账号持有人自行接受平台服务协议后，创建了与工程 Bundle name 相同的 HarmonyOS 应用 APP ID：包名 `com.g1m1.skillagent`，类型“应用”，支持设备“手机”，所属项目 `G1M1`。没有提交应用市场上架。
- 为 `g1-echo` 和 `g1-text-length` 分别配置该包名及中文映射，选择“小艺主对话”和上述测试组，发布真机测试。两页发布后均显示“取消发布 / 重新发布”；该测试发布按[华为真机测试指南](https://developer.huawei.com/consumer/cn/doc/doccenter-celia/skill-real-machine-testing-0000002592771628)有效 15 天，不等于公开上架。

平台截图：[两项 Skill](skill-list.png)、[测试组成员状态](test-group.png)、[回显测试发布](g1-echo-test-published.png)、[长度测试发布](g1-text-length-test-published.png)。截图未包含账号凭据；Skill 列表的“草稿”是上架状态，不能据此否定单独的真机测试发布。

## 发布后的 Pura 70 复测

通过 HDC 确认手机前台为小艺对话页，以 `uitest uiInput` 输入固定请求，并在发送前读取 `dumpLayout` 核对输入文本。发布前相同点名请求得到“没找到工具”；发布后得到如下结果：

| 输入 | 小艺新回复 | 判定 |
| --- | --- | --- |
| `请使用 g1-echo 原样回显 你好，鸿蒙` | `你好，鸿蒙` | 回复符合回显预期，但无法仅凭文本判定是目标 Skill 执行还是模型直接回答 |
| `请使用 g1-text-length 计算 你好😀ABC 的 UTF-16 码元长度` | `"你好😀ABC" 的 UTF-16 码元长度是 6（2 个汉字各 1 码元，😀 占 2 码元，3 个字母各 1 码元）。` | 计算自相矛盾，正确为 `2 + 2 + 3 = 7`；F05 的应用内正确结果不能替代此系统路径 |

同轮 `hdc shell hilog -x -e system_skill` 和 `hdc shell hilog -x -e G1M1` 均无匹配输出。日志过滤结果仅作辅助观察；没有取得系统匹配/调度、`system_skill_entered`、`system_result_reported` 或可关联的系统结果包。手机截图和完整布局包含与本轮无关的私人会话，未提交仓库。

**S01/S02：**平台导入、测试组和真机测试发布已完成，发布后的回复与此前不同；但缺少明确的系统匹配证据，S01 仍未验收通过。长度用例返回错误且无目标脚本/上报证据，S02 未通过。A02 公共调用接口阻断不受此操作影响。

操作入口：[Skill 列表](https://developer.huawei.com/consumer/cn/hag/hagindex.html#/agentHome/workSpace/skillList)、[真机测试管理](https://developer.huawei.com/consumer/cn/hag/hagindex.html#/console-web/pub-management/userList)。平台操作所见为当前账号状态，不能推断其他团队账号或手机侧资格。
