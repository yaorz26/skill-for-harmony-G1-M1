# 待确认：MateBook 主对话应用 Skill 真机测试

设备为 HUAWEI MateBook 14，型号 MNTXM-24B；HarmonyOS 7.0.0.111（SP12C00E103R12P2patch03），API 26.0.0。小艺已通过应用市场更新为 11.7.9.300（110709300）。设置 → 软件更新 → 升级尝鲜显示“暂无升级活动”。

小艺开放平台的两个应用 Skill 已发布到“小艺主对话”真机测试，命名空间为 com.yaorz26.g1m1.skillagent，注册名 yaorz26-g1m1-echo-20261107、yaorz26-g1m1-text-length-20261107，API 版本为 26 / 26。发布响应 code=0，查询 hasTestRelease=true；测试组包含当前平台账号且已激活，用户确认设备登录同一账号。

平台当前配置入口提供 cloud / cloudSandbox，availableOn=[cloud]；尝试添加 pc 或仅使用 pc 都返回参数错误 code=100000112。已安装签名 HAP 的 skillProfiles、2in1 和脚本注册均存在。小艺主对话未出现“Skill真机测试中”，指定技能名调用时未观测到应用脚本日志。

请确认：

1. 此型号和系统构建是否已支持“小艺主对话”应用 Skill 真机测试？如果需要特定 Beta 活动或能力开通，应使用哪个入口？
2. PC 端当前应使用主对话、小艺 Claw，还是另一条调试入口？应用 Skill 的 availableOn 应如何配置？
3. 若版本与配置满足要求，如何排查测试账号未收到就绪入口、Skill 未进入可用列表的问题？

本说明尚未发送；如需工单，可由账号所有者在私密支持渠道补充账号标识及平台 Skill ID。
