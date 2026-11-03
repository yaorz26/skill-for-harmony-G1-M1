import { TraceEvent } from './Contracts';

export class TraceReporter {
  static emit(requestId: string, stage: string, skillId: string,
    executionPath: string, errCode: string = ''): void {
    const event: TraceEvent = {
      requestId: requestId,
      stage: stage,
      skillId: skillId,
      executionPath: executionPath,
      timestampMs: Date.now(),
      errCode: errCode
    };
    // Date.now 仅作链路关联；性能实验须另行定义单调时钟及计时边界。
    console.info(`[G1M1] ${JSON.stringify(event)}`);
  }
}
