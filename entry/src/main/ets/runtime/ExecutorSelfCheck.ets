// C 执行器运行时自检：在目标鸿蒙运行时用测试替身验证 F08/F09。
// 替身只存在于本文件；AppSkillService / InAppSkillInvoker 保持零故障开关。
import { SkillCall, SkillInvoker, SkillResult } from '../agent/Contracts';
import { SkillExecutor } from './SkillExecutor';
import { SkillRegistry } from '../registry/SkillRegistry';
import { AppSkillService } from '../service/AppSkillService';
import { TraceReporter } from '../agent/TraceReporter';

export interface SelfCheckItem {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface SelfCheckSummary {
  executionPath: string;
  f08ErrCode: string;
  f08Invocations: number;
  f09ErrCode: string;
  f09Invocations: number;
  f09LateCompleted: number;
  f09ErrCodeAfterLate: string;
  controlStatus: string;
  allPassed: boolean;
  items: SelfCheckItem[];
}

class FaultyInvoker implements SkillInvoker {
  executionPath: string = 'self-check-fault';
  invocations: number = 0;

  async invoke(call: SkillCall): Promise<SkillResult> {
    this.invocations += 1;
    throw new Error('injected fault for executor self-check');
  }
}

class SlowInvoker implements SkillInvoker {
  executionPath: string = 'self-check-slow';
  invocations: number = 0;
  completed: number = 0;
  private delayMs: number;

  constructor(delayMs: number) {
    this.delayMs = delayMs;
  }

  async invoke(call: SkillCall): Promise<SkillResult> {
    this.invocations += 1;
    await new Promise<void>((resolve: () => void) => {
      setTimeout(resolve, this.delayMs);
    });
    this.completed += 1;
    return AppSkillService.execute(call, this.executionPath);
  }
}

export class ExecutorSelfCheck {
  static async run(): Promise<SelfCheckSummary> {
    const requestId = `self-check-${Date.now()}`;
    TraceReporter.emit(requestId, 'self_check_started', '', 'self-check');
    const registry = new SkillRegistry();
    const call: SkillCall = { requestId: requestId, skillId: 'g1-echo', argument: 'self-check' };
    const items: SelfCheckItem[] = [];

    const faulty = new FaultyInvoker();
    const f08 = await new SkillExecutor(faulty).execute(call, registry);
    items.push({ name: 'F08 errCode=ERR_INTERNAL', expected: 'ERR_INTERNAL',
      actual: f08.errCode, passed: f08.errCode === 'ERR_INTERNAL' });
    items.push({ name: 'F08 调用恰好一次', expected: '1',
      actual: `${faulty.invocations}`, passed: faulty.invocations === 1 });
    items.push({ name: 'F08 保留替身executionPath', expected: 'self-check-fault',
      actual: f08.executionPath, passed: f08.executionPath === 'self-check-fault' });

    const slow = new SlowInvoker(200);
    const startedAt: number = Date.now();
    const f09 = await new SkillExecutor(slow, 50).execute(call, registry);
    const elapsed: number = Date.now() - startedAt;
    items.push({ name: 'F09 errCode=ERR_TIMEOUT', expected: 'ERR_TIMEOUT',
      actual: f09.errCode, passed: f09.errCode === 'ERR_TIMEOUT' });
    items.push({ name: 'F09 提前返回(<150ms)', expected: '<150',
      actual: `${elapsed}`, passed: elapsed < 150 });
    await new Promise<void>((resolve: () => void) => {
      setTimeout(resolve, 350);
    });
    items.push({ name: 'F09 迟到结果不改写返回值', expected: 'ERR_TIMEOUT',
      actual: f09.errCode, passed: f09.errCode === 'ERR_TIMEOUT' });
    items.push({ name: 'F09 迟到后不重试', expected: '1',
      actual: `${slow.invocations}`, passed: slow.invocations === 1 });
    items.push({ name: 'F09 底层照常完成(不宣称取消)', expected: '1',
      actual: `${slow.completed}`, passed: slow.completed === 1 });

    const controlCall: SkillCall = { requestId: requestId, skillId: 'g1-text-length', argument: '你好ABC' };
    const control = await new SkillExecutor(new SlowInvoker(0), 3000).execute(controlCall, registry);
    items.push({ name: '对照组 success', expected: 'success',
      actual: control.status, passed: control.status === 'success' });

    let allPassed = true;
    for (const item of items) {
      if (!item.passed) {
        allPassed = false;
      }
    }
    TraceReporter.emit(requestId, 'self_check_finished', '', 'self-check',
      allPassed ? '' : 'ERR_SELF_CHECK_FAILED');
    const summary: SelfCheckSummary = {
      executionPath: 'self-check',
      f08ErrCode: f08.errCode,
      f08Invocations: faulty.invocations,
      f09ErrCode: f09.errCode,
      f09Invocations: slow.invocations,
      f09LateCompleted: slow.completed,
      f09ErrCodeAfterLate: f09.errCode,
      controlStatus: control.status,
      allPassed: allPassed,
      items: items
    };
    return summary;
  }
}
