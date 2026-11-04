import { AgentRequest, IntentRouting, SkillCall, SkillInvoker, SkillResult, failedResult } from './Contracts';
import { TraceReporter } from './TraceReporter';
import { IntentRouter } from '../router/IntentRouter';
import { SkillRegistry } from '../registry/SkillRegistry';
import { SkillExecutor } from '../runtime/SkillExecutor';
import { InAppSkillInvoker } from '../adapters/InAppSkillInvoker';

export class AgentService {
  private registry: SkillRegistry;
  private router: IntentRouting;
  private executor: SkillExecutor;
  private executionPath: string;

  constructor(invoker: SkillInvoker = new InAppSkillInvoker(),
    router: IntentRouting = new IntentRouter(), registry: SkillRegistry = new SkillRegistry()) {
    this.executor = new SkillExecutor(invoker);
    this.executionPath = invoker.executionPath;
    this.router = router;
    this.registry = registry;
  }

  supportedHint(): string {
    return this.registry.supportedHint();
  }

  async handle(request: AgentRequest): Promise<SkillResult> {
    TraceReporter.emit(request.requestId, 'request_received', '', this.executionPath);
    if (request.requestId.trim().length === 0 || request.text.trim().length === 0 ||
      request.text.length > 1100) {
      const result = failedResult(request.requestId, '', 'ERR_INVALID_PARAMS',
        'requestId 和指令不能为空，指令最长 1100 个 UTF-16 码元', this.executionPath);
      TraceReporter.emit(request.requestId, 'response_returned', '', this.executionPath, result.errCode);
      return result;
    }

    try {
      return await this.routeAndExecute(request);
    } catch (_error) {
      const result = failedResult(request.requestId, '', 'ERR_INTERNAL',
        'Agent 路由或执行异常', this.executionPath);
      TraceReporter.emit(request.requestId, 'response_returned', '', this.executionPath, result.errCode);
      return result;
    }
  }

  private async routeAndExecute(request: AgentRequest): Promise<SkillResult> {
    const decision = this.router.route(request.text, this.registry.list());
    TraceReporter.emit(request.requestId, 'intent_matched', decision.skillId, this.executionPath,
      decision.matched ? '' : 'ERR_NO_SKILL');
    if (!decision.matched) {
      const result = failedResult(request.requestId, '', 'ERR_NO_SKILL',
        this.registry.supportedHint(), this.executionPath);
      TraceReporter.emit(request.requestId, 'response_returned', '', this.executionPath, result.errCode);
      return result;
    }

    const call: SkillCall = {
      requestId: request.requestId,
      skillId: decision.skillId,
      argument: decision.argument
    };
    const result = await this.executor.execute(call, this.registry);
    TraceReporter.emit(request.requestId, 'response_returned', result.skillId,
      result.executionPath, result.errCode);
    return result;
  }
}
