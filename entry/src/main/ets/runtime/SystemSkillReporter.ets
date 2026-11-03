import { scriptManager } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { SkillResult } from '../agent/Contracts';
import { TraceReporter } from '../agent/TraceReporter';

export class SystemSkillReporter {
  static async report(info: scriptManager.ArkTSScriptInfo, value: SkillResult): Promise<void> {
    const payload: Record<string, Object> = {
      'type': 'result',
      'requestId': value.requestId,
      'skillId': value.skillId,
      'status': value.status,
      'data': value.data,
      'errCode': value.errCode,
      'errMsg': value.errMsg,
      'executionPath': value.executionPath
    };
    const result: scriptManager.ExecuteResult = {
      code: value.status === 'success' ? 0 : -1,
      result: payload
    };
    try {
      await scriptManager.completeArkTSScriptInApp(info.context, info.requestCode, result);
      TraceReporter.emit(value.requestId, 'system_result_reported', value.skillId, 'system-skill');
    } catch (e) {
      const error = e as BusinessError;
      TraceReporter.emit(value.requestId, 'system_report_failed', value.skillId,
        'system-skill', 'ERR_REPORT_FAILED');
      console.error(`[G1M1] completeArkTSScriptInApp failed: ${error.code}`);
    }
  }
}
