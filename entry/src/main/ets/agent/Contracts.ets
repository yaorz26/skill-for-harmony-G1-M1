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

export interface SkillInvoker {
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
