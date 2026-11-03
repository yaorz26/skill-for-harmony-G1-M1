import { SkillCall, SkillInvoker, SkillResult, failedResult } from '../agent/Contracts';
import { TraceReporter } from '../agent/TraceReporter';
import { SkillRegistry } from '../registry/SkillRegistry';

export class SkillExecutor {
  private invoker: SkillInvoker;
  private timeoutMs: number;

  constructor(invoker: SkillInvoker, timeoutMs: number = 3000) {
    this.invoker = invoker;
    this.timeoutMs = timeoutMs;
  }

  async execute(call: SkillCall, registry: SkillRegistry): Promise<SkillResult> {
    if (!registry.contains(call.skillId)) {
      return failedResult(call.requestId, call.skillId, 'ERR_NO_SKILL',
        '能力未注册', 'in-app');
    }
    if (call.argument.length === 0 || call.argument.length > 1024) {
      return failedResult(call.requestId, call.skillId, 'ERR_INVALID_PARAMS',
        '文本长度应为 1–1024 个 UTF-16 码元', 'in-app');
    }

    TraceReporter.emit(call.requestId, 'skill_started', call.skillId, 'in-app');
    let timer: number = -1;
    try {
      const timeout = new Promise<SkillResult>((resolve) => {
        timer = setTimeout(() => {
          resolve(failedResult(call.requestId, call.skillId, 'ERR_TIMEOUT',
            '调用超时', 'in-app'));
        }, this.timeoutMs);
      });
      // 超时只终止等待，不保证底层操作被取消；框架不自动重试。
      const result = await Promise.race<SkillResult>([this.invoker.invoke(call), timeout]);
      TraceReporter.emit(call.requestId, 'skill_finished', call.skillId,
        result.executionPath, result.errCode);
      return result;
    } catch (e) {
      const result = failedResult(call.requestId, call.skillId, 'ERR_INTERNAL',
        '应用能力执行异常', 'in-app');
      TraceReporter.emit(call.requestId, 'skill_finished', call.skillId, 'in-app', result.errCode);
      return result;
    } finally {
      if (timer !== -1) {
        clearTimeout(timer);
      }
    }
  }
}
