import { IntentDecision, IntentRouting, SkillDescriptor } from '../agent/Contracts';

export class IntentRouter implements IntentRouting {
  /** 实现异步路由端口，供 AgentService 统一调用。 */
  async route(text: string, skills: SkillDescriptor[]): Promise<IntentDecision> {
    return IntentRouter.match(text, skills);
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
