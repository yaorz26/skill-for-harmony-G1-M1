import { AgentRequest, AsyncIntentRouting, IntentDecision, IntentRouting, RouteEvaluation,
  SkillDescriptor } from '../agent/Contracts';

export class IntentRouter implements IntentRouting, AsyncIntentRouting {
  /** 同步执行规则匹配，与现有 AgentService 接线完全兼容。 */
  route(text: string, skills: SkillDescriptor[]): IntentDecision {
    return IntentRouter.match(text, skills);
  }

  /** 异步路由端口适配，便于后续与大模型或远端异步路由器统一装配。 */
  async routeAsync(text: string, skills: SkillDescriptor[]): Promise<IntentDecision> {
    return IntentRouter.match(text, skills);
  }

  /**
   * 独立完成请求初检、前缀匹配、白名单复核与参数长度校验，不调用执行器。
   * 供路由模块独立测试全部命中/未命中/缺参/超长分支，也可供成员 A 在装配阶段直接复用。
   */
  evaluate(request: AgentRequest, skills: SkillDescriptor[],
    supportedHint: string = '支持：回显 文本；长度 文本'): RouteEvaluation {
    // 入口上限在 trim 前按原始 UTF-16 码元判定，与契约 1100 码元包络限制一致。
    if (request.requestId.trim().length === 0 || request.text.trim().length === 0 ||
      request.text.length > 1100) {
      return {
        ok: false, matched: false, skillId: '', argument: '',
        errCode: 'ERR_INVALID_PARAMS',
        errMsg: 'requestId 和指令不能为空，指令最长 1100 个 UTF-16 码元'
      };
    }

    const decision = this.route(request.text, skills);
    const registered = decision.matched && skills.some((item: SkillDescriptor): boolean => item.id === decision.skillId);
    if (!registered) {
      return {
        ok: false, matched: false, skillId: '', argument: '',
        errCode: 'ERR_NO_SKILL', errMsg: supportedHint
      };
    }

    const trimmedArg = decision.argument.trim();
    if (trimmedArg.length === 0 || trimmedArg.length > 1024) {
      return {
        ok: false, matched: true, skillId: decision.skillId, argument: trimmedArg,
        errCode: 'ERR_INVALID_PARAMS',
        errMsg: '文本长度应为 1–1024 个 UTF-16 码元'
      };
    }

    return {
      ok: true, matched: true, skillId: decision.skillId, argument: trimmedArg,
      errCode: '', errMsg: ''
    };
  }

  /**
   * 基于显式前缀的确定性规则路由：区分大小写，仅认普通空格（U+0020）分隔。
   * 遍历全部候选并取最长命中前缀，消除不同注册顺序对重叠前缀（如“查”与“查 天气”）的影响。
   */
  static match(text: string, skills: SkillDescriptor[]): IntentDecision {
    const input = text.trim();
    let bestSkillId: string = '';
    let bestPrefix: string = '';
    for (const skill of skills) {
      for (const prefix of skill.prefixes) {
        // 纯前缀输入（input === prefix）需判定为已命中但参数为空，后续交参数校验返回 ERR_INVALID_PARAMS 而非 ERR_NO_SKILL；
        // 带参输入强制要求紧跟 U+0020，拒绝无空格粘连、制表符、全角空格及英文单词前缀误匹配（如 echoes）。
        const hit = input === prefix || input.startsWith(`${prefix} `);
        if (hit && prefix.length > bestPrefix.length) {
          bestSkillId = skill.id;
          bestPrefix = prefix;
        }
      }
    }
    if (bestPrefix.length === 0) {
      return { matched: false, skillId: '', argument: '' };
    }
    return {
      matched: true,
      skillId: bestSkillId,
      argument: input.substring(bestPrefix.length).trim()
    };
  }
}
