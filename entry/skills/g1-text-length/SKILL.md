---
name: g1-text-length
description: 返回指定文本的 UTF-16 码元长度，用于测试应用 Skill 的计算和结果回传；响应“长度 你好ABC”等明确请求。
---

# 文本长度 Skill

## 触发场景

用户明确要求计算文本长度，例如“长度 你好ABC”。这里长度为 `String.length` 的 UTF-16 码元数：中文通常占 1，emoji“😀”占 2；不统计单词数、字素数或文件大小。

## 场景1：计算长度（measure）

```text
exec-cli(command: ohos-arkTSScript --skillName 'g1-text-length' --scriptPath 'scripts/TextLengthSkill.ets' --functionName 'measure' --args '{"arg1":"你好ABC"}')
```

执行参数：`arg1 → argv[0]`。文本长度 1–1024 个 UTF-16 码元，不能全为空白。

下方标准 JSON Schema 的 `maxLength` 按 Unicode 码点计数，只作宽松预校验；入口再校验 UTF-16 码元限制及非全空白约束。例：512 个“😀”占 1024 个码元，可接受；513 个即返回 `ERR_INVALID_PARAMS`。Schema 通过不代表已通过全部业务校验。

```json
{
  "args": {
    "type": "object",
    "properties": {
      "arg1": { "type": "string", "minLength": 1, "maxLength": 1024, "description": "要计算长度的文本，不能全为空白" }
    },
    "required": ["arg1"],
    "additionalProperties": false
  }
}
```

## 执行返回值

成功示例（requestId 以系统实际 requestCode 为准）：

```json
{
  "type": "result", "requestId": "system-request-002", "skillId": "g1-text-length",
  "status": "success", "data": { "text": "你好ABC", "length": 5, "unit": "utf16-code-unit" },
  "errCode": "", "errMsg": "", "executionPath": "system-skill"
}
```

缺参、全空白或超长时返回失败：

```json
{
  "type": "result", "requestId": "system-request-002", "skillId": "g1-text-length",
  "status": "failed", "data": {}, "errCode": "ERR_INVALID_PARAMS",
  "errMsg": "文本长度应为 1–1024 个 UTF-16 码元且不能全为空白", "executionPath": "system-skill"
}
```

返回值 Schema：

```json
{
  "type": "object",
  "required": ["type", "requestId", "skillId", "status", "data", "errCode", "errMsg", "executionPath"],
  "properties": {
    "type": { "const": "result" },
    "requestId": { "type": "string" },
    "skillId": { "const": "g1-text-length" },
    "status": { "enum": ["success", "failed"] },
    "data": { "type": "object" },
    "errCode": { "type": "string" },
    "errMsg": { "type": "string" },
    "executionPath": { "const": "system-skill" }
  },
  "oneOf": [
    {
      "properties": {
        "status": { "const": "success" },
        "data": {
          "properties": {
            "text": { "type": "string" }, "length": { "type": "integer", "minimum": 1, "maximum": 1024 },
            "unit": { "const": "utf16-code-unit" }
          },
          "required": ["text", "length", "unit"]
        },
        "errCode": { "const": "" }, "errMsg": { "const": "" }
      }
    },
    {
      "properties": {
        "status": { "const": "failed" }, "data": { "maxProperties": 0 },
        "errCode": { "const": "ERR_INVALID_PARAMS" }, "errMsg": { "type": "string", "minLength": 1 }
      }
    }
  ]
}
```

脚本通过 `completeArkTSScriptInApp` 上报；上报失败仅记日志，不能视为调用方已收到结果。本文件是待构建、待真机验证的声明。
