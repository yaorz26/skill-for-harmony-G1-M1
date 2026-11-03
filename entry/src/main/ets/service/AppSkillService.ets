import { SkillCall, SkillResult, failedResult } from '../agent/Contracts';

export class AppSkillService {
  static execute(call: SkillCall, executionPath: string): SkillResult {
    if (call.argument.trim().length === 0 || call.argument.length > 1024) {
      return failedResult(call.requestId, call.skillId, 'ERR_INVALID_PARAMS',
        '文本长度应为 1–1024 个 UTF-16 码元且不能全为空白', executionPath);
    }
    if (call.skillId !== 'g1-echo' && call.skillId !== 'g1-text-length') {
      return failedResult(call.requestId, call.skillId, 'ERR_NO_SKILL',
        '业务能力不存在', executionPath);
    }
    const data: Record<string, Object> = { 'text': call.argument };
    if (call.skillId === 'g1-text-length') {
      // 固定 String.length 语义：UTF-16 码元数，不能当作字素或单词数。
      data['length'] = call.argument.length;
      data['unit'] = 'utf16-code-unit';
    }
    return {
      requestId: call.requestId,
      skillId: call.skillId,
      status: 'success',
      data: data,
      errCode: '',
      errMsg: '',
      executionPath: executionPath
    };
  }
}
