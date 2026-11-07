# A：替换被占用的应用包名

日期：2026-11-07（北京时间）。用户在开发者中心创建应用时发现原包名已存在，且当前账号应用列表中查不到该记录，因此改用账号前缀包名。新包名是否可注册仍以平台校验为准。

- 原包名：`com.g1m1.skillagent`。
- 新包名：`com.yaorz26.g1m1.skillagent`。
- 源码提交：`831d09f44c20cd7da92ff05b75c95e9c400cf205`。仅同步 AppScope/app.json5 与 AgentCard 的 appInfo.bundleName。
- 两个已调整的 Skill 注册名保持为 `yaorz26-g1m1-echo-20261107` 与 `yaorz26-g1m1-text-length-20261107`；路由、业务及结果标识没有变化。

## 验证

结构检查通过；共享核心 28 项、A 入口装配 32 项通过。未签名 HAP 构建成功，8.354 秒，33 tasks（29 executed、4 up-to-date）。最终 HAP 的应用包名和 AgentCard 包名均为新包名，两个 skillProfiles 名称与预期一致。

本机产物：`D:/Temp/g1m1-yaorz26-bundle-20261107-unsigned.hap`，124251 bytes，SHA-256 `AD8B2D6E75851A5018285C2B2B2F1C9F5F9EDCF366273748D6DD3E8F8CE822E0`。此文件未签名，不能作为可真机安装的调试包交付；不覆盖前轮旧包名的签名产物。

## 签名与平台前提

只读解码本机现有调试 Profile，确认其 bundle-name 为旧包名，类型为 debug。没有修改或伪造 Profile；密钥、证书、Profile 内容和设备标识不入库。

后续需设备持有人在相同开发者账号或团队下创建新包名对应的 APP ID，并在独立临时工程的 DevEco Signing Configs 中重新生成匹配新包名的签名。已有临时工程的 AppScope 与 AgentCard 已同步新包名。匹配的 Profile 生成后，再构建签名 HAP、核对身份、安装并继续平台和真机复测。

本轮设备未连接，尚未重新签名、安装或完成平台导入。旧包名的真机证据继续绑定原固定版本，不视为新包名的运行证据。
