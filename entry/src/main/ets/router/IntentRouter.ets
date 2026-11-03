import { IntentDecision, SkillDescriptor } from '../agent/Contracts';

export class IntentRouter {
  route(text: string, skills: SkillDescriptor[]): IntentDecision {
    const input = text.trim();
    for (const skill of skills) {
      for (const prefix of skill.prefixes) {
        if (input === prefix || input.startsWith(`${prefix} `)) {
          return {
            matched: true,
            skillId: skill.id,
            argument: input.substring(prefix.length).trim()
          };
        }
      }
    }
    return { matched: false, skillId: '', argument: '' };
  }
}
