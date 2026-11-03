import { SkillCall, SkillInvoker, SkillResult } from '../agent/Contracts';
import { AppSkillService } from '../service/AppSkillService';

// 框架基线：直接复用应用业务，不触发系统 Skill 脚本调度。
export class InAppSkillInvoker implements SkillInvoker {
  async invoke(call: SkillCall): Promise<SkillResult> {
    return AppSkillService.execute(call, 'in-app');
  }
}
