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

// 独立路由与入参预检结果，供路由单测或装配层在不触发执行器的前提下判定错误分类。
export interface RouteEvaluation {
  ok: boolean;
  matched: boolean;
  skillId: string;
  argument: string;
  errCode: string;
  errMsg: string;
}

// v0 同步路由端口，与当前 AgentService 调用方式保持零改动兼容。
export interface IntentRouting {
  /** 根据输入与白名单目录同步产出路由决策，不触发能力执行。 */
  route(text: string, skills: SkillDescriptor[]): IntentDecision;
}

// 可选异步路由端口，供后续接入大模型或远端路由时由装配层按需选用。
export interface AsyncIntentRouting {
  /** 根据输入与白名单目录异步产出路由决策，不触发能力执行。 */
  routeAsync(text: string, skills: SkillDescriptor[]): Promise<IntentDecision>;
}

export interface SkillInvoker {
  executionPath: string;
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
