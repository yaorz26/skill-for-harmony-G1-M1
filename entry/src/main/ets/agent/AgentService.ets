import { AgentRequest, IntentDecision, IntentRouting, SkillCall, SkillInvoker, SkillResult,
  failedResult } from './Contracts';
import { TraceReporter } from './TraceReporter';
import { IntentRouter } from '../router/IntentRouter';
import { SkillRegistry } from '../registry/SkillRegistry';
import { SkillExecutor } from '../runtime/SkillExecutor';
import { InAppSkillInvoker } from '../adapters/InAppSkillInvoker';

// Agent 编排核心：仅依赖 Contracts 接口，不耦合页面组件或系统扩展回调类型。
export class AgentService {
  private registry: SkillRegistry;
  private router: IntentRouting;
  private executor: SkillExecutor;

  /** 组装意图路由器、能力白名单与执行适配器；默认使用规则路由与应用内业务适配器。 */
  constructor(router: IntentRouting = new IntentRouter(), registry: SkillRegistry = new SkillRegistry(),
    invoker: SkillInvoker = new InAppSkillInvoker()) {
    this.router = router;
    this.registry = registry;
    this.executor = new SkillExecutor(invoker);
  }

  /** 处理单次 Agent 请求：完成入口初检、意图路由、白名单复核、参数规整与执行分发，并串联同一 requestId 日志。 */
  async handle(request: AgentRequest): Promise<SkillResult> {
    TraceReporter.emit(request.requestId, 'request_received', '', 'in-app');
    // 长度上限在 trim 前按原始 UTF-16 码元判定，与接口契约的 1100 码元入口包络限制一致。
    if (request.requestId.trim().length === 0 || request.text.trim().length === 0 ||
      request.text.length > 1100) {
      const result = failedResult(request.requestId, '', 'ERR_INVALID_PARAMS',
        'requestId 和指令不能为空，指令最长 1100 个 UTF-16 码元', 'in-app');
      TraceReporter.emit(request.requestId, 'response_returned', '', 'in-app', result.errCode);
      return result;
    }

    let decision: IntentDecision = { matched: false, skillId: '', argument: '' };
    try {
      decision = await this.router.route(request.text, this.registry.list());
    } catch (e) {
      const result = failedResult(request.requestId, '', 'ERR_INTERNAL', '意图路由异常', 'in-app');
      TraceReporter.emit(request.requestId, 'response_returned', '', 'in-app', result.errCode);
      return result;
    }

    // 二次核对注册表：即便后续替换为大模型路由并幻觉出未注册 skillId，也在此处拦截，禁止越过白名单。
    const matched = decision.matched && this.registry.contains(decision.skillId);
    TraceReporter.emit(request.requestId, 'intent_matched', matched ? decision.skillId : '', 'in-app',
      matched ? '' : 'ERR_NO_SKILL');
    if (!matched) {
      const result = failedResult(request.requestId, '', 'ERR_NO_SKILL',
        this.registry.supportedHint(), 'in-app');
      TraceReporter.emit(request.requestId, 'response_returned', '', 'in-app', result.errCode);
      return result;
    }

    // 下游 SkillExecutor 仅按 argument.length === 0 判空；此处统一 trim，防止自定义路由器传入纯空白参数漏检。
    const call: SkillCall = {
      requestId: request.requestId,
      skillId: decision.skillId,
      argument: decision.argument.trim()
    };
    const result = await this.executor.execute(call, this.registry);
    TraceReporter.emit(request.requestId, 'response_returned', result.skillId,
      result.executionPath, result.errCode);
    return result;
  }
}
