import { scriptManager } from '@kit.AbilityKit';
import { SkillCall } from '../../../src/main/ets/agent/Contracts';
import { TraceReporter } from '../../../src/main/ets/agent/TraceReporter';
import { AppSkillService } from '../../../src/main/ets/service/AppSkillService';
import { SystemSkillReporter } from '../../../src/main/ets/runtime/SystemSkillReporter';

export default class EchoSkill {
  public async echo(info: scriptManager.ArkTSScriptInfo, ...argv: string[]): Promise<void> {
    const call: SkillCall = {
      requestId: info.requestCode,
      skillId: 'g1-echo',
      argument: argv.length > 0 ? argv[0] : ''
    };
    TraceReporter.emit(call.requestId, 'system_skill_entered', call.skillId, 'system-skill');
    const result = AppSkillService.execute(call, 'system-skill');
    await SystemSkillReporter.report(info, result);
  }
}
