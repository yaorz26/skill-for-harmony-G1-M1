# D 非真机事项收尾核对（2026-11-06）

本轮在 `origin/main@8fd15e5` 的 D 收尾分支核对已有验收材料；不把本地文档修改算作被测 HAP 的源码。F01–F10 的固定 HAP、模拟器与逐项证据分别见[首轮报告](2026-11-06-D-acceptance/report.md)和[补测报告](2026-11-06-D-followup/report.md)。补测证据目录的 `manifest.json` 有 41 个文件条目，本轮逐项复核仓库工作区字节数与 SHA-256，均匹配。

本轮重新运行 `node tools/run-acceptance.mjs --out <新临时目录>`：structure、core、a-entry、c-executor、evidence-tool 五组均为 `passed`、退出码 0；检查期间源码指纹不变。该检查仅覆盖本机逻辑，不代替设备或系统路径。C 对原证据包补充的三份 Git LF 清单已进入 `main`，见[交付索引](../delivery-index.md)。

F01 的命令行 `assembleHap` 已在固定源码 `ab9691f` 上通过并留有构建摘要。此时 DevEco Studio 26.0.0.851 尚无可操作窗口，IDE 同步未验证；后续查明旧系统目录的 `.port` 无法访问，改用独立临时系统目录后打开了同一提交的英文路径副本并完成同步，见[后续 IDE 同步记录](2026-11-06-D-ide-sync/report.md)。两轮事实分别保留。

仓库的[验收表](../acceptance.md)与[交付索引](../delivery-index.md)已更新模拟器补测状态。待办为：签名真机与受支持调用方条件下的 F/S/A/E 验收、录屏和设备排期；A02 真实系统 Skill 发起接口/适配器的阻断解除；最后由 A 确认整体交付。当前没有真实系统调用或端到端成功证据。
