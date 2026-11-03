// 共享接口由成员 B 维护；变更时同步 docs/interfaces.md。
export interface AgentRequest {
  requestId: string;
  text: string;
}

export interface SkillDescriptor {
  id: string;
  name: string;
  prefixes: string[];
}

export interface SkillCall {
  requestId: string;
  skillId: string;
  argument: string;
}

export interface SkillResult {
  requestId: string;
  skillId: string;
  status: string;
  data: Record<string, Object>;
  errCode: string;
  errMsg: string;
  executionPath: string;
}

export interface IntentDecision {
  matched: boolean;
  skillId: string;
  argument: string;
}

// 意图路由可替换端口；采用异步签名以便后续替换大模型或远端路由时无需改动契约与调用方。
export interface IntentRouting {
  /** 根据原始输入与当前白名单目录产出路由决策，不触发任何能力执行。 */
  route(text: string, skills: SkillDescriptor[]): Promise<IntentDecision>;
}

export interface SkillInvoker {
  /** 按统一的 SkillCall 执行目标能力并返回结构化结果。 */
  invoke(call: SkillCall): Promise<SkillResult>;
}

export interface TraceEvent {
  requestId: string;
  stage: string;
  skillId: string;
  executionPath: string;
  timestampMs: number;
  errCode: string;
}

/** 构造统一外壳的失败响应，保证失败时 data 为空对象且保留链路标识。 */
export function failedResult(requestId: string, skillId: string, errCode: string,
  errMsg: string, executionPath: string): SkillResult {
  return {
    requestId: requestId,
    skillId: skillId,
    status: 'failed',
    data: {},
    errCode: errCode,
    errMsg: errMsg,
    executionPath: executionPath
  };
}
