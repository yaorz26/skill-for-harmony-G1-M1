# D 固定版本 F01：DevEco Studio IDE 同步

执行日期：2026-11-06。DevEco Studio 26.0.0.851；SDK API 26。被测工程为英文路径的本地临时 Git 副本，检出 `ab9691fda02a87c40cc162b166128b1a4d37aa46`；同步后 `git diff --name-only` 为空。此记录只验证 IDE 同步；同一提交的未签名 HAP 命令行构建和产物哈希见[首轮验收](../2026-11-06-D-acceptance/report.md)。

## 启动问题与处理

旧 IDE 系统目录 `DevEcoStudio26.0/.port` 是 2026-11-03 留下的重解析点；Windows 对其执行权限读取、`fsutil reparsepoint query` 和移动操作均返回“系统无法访问此文件”。旁边 `.pid` 指向的旧进程已不存在。DevEco Studio 启动时尝试删除 `.port`，抛出 `FileSystemException`，无法显示窗口。未删除或覆盖旧目录。

本轮以仅对新进程生效的 `DEVECOSTUDIO_PROPERTIES` 指向临时 properties 文件，设置独立的 `idea.system.path`。IDE 随后打开窗口，并在新的系统目录生成日志。该办法绕开旧启动锁；旧目录自身仍需以后单独处理。IDE 初次恢复打开旧副本，不计为 F01 证据；随后打开上述固定提交的英文路径副本。

## 同步结果

在固定副本的项目窗口中执行打开工程后的自动同步。IDE 日志对该轮记录：

| 时间（北京时间） | 记录 |
| --- | --- |
| 22:09:53 | `Sync project started OPEN_PROJECT` |
| 22:10:00 | `Ohpm install executed for module g1m1-f01-ide-ab9691f-20261106` |
| 22:11:18 | `project sync success`；`Sync project finished in 1 m 24 s 347 ms` |
| 22:11:35 | 该轮摘要 `syncDataStatus: true` |

原始日志保存在本机临时系统目录的 `system/log/idea.log`；[关联日志摘录](sync-log-excerpt.txt)保留了上述五个原始节点，避免提交与项目无关的本机路径和插件日志。同步完成后项目窗口的失败横幅消失。**F01 的 IDE 同步子项通过**；这是项目同步结果，不改变真机与系统 Skill 用例状态。
