import { AgentService } from '../agent/AgentService';
import { AgentRequest, SkillResult, failedResult } from '../agent/Contracts';
import { TraceReporter } from '../agent/TraceReporter';

const MAX_ENVELOPE_LENGTH: number = 8192;
const MAX_REQUEST_ID_LENGTH: number = 128;

export interface AgentResponseSender {
  sendData(data: string): void;
}

interface BridgeOutcome {
  result: SkillResult;
  send: boolean;
}

export class AgentRequestBridge {
  private agent: AgentService;
  private open: boolean = true;
  private requestIds: Set<string> = new Set<string>();
  private pending: number = 0;

  constructor(agent: AgentService = new AgentService()) {
    this.agent = agent;
  }

  isOpen(): boolean {
    return this.open;
  }

  close(): void {
    this.open = false;
  }

  async receive(data: string, sender: AgentResponseSender): Promise<void> {
    let result: SkillResult | undefined = undefined;
    try {
      const outcome = await this.process(data);
      result = outcome.result;
      if (!outcome.send) {
        TraceReporter.emit(result.requestId, 'agent_duplicate_ignored', '', 'agent-extension');
        return;
      }
      if (!this.open) {
        TraceReporter.emit(result.requestId, 'agent_response_dropped', result.skillId, 'agent-extension');
        return;
      }
      sender.sendData(JSON.stringify(result));
      TraceReporter.emit(result.requestId, 'agent_response_sent', result.skillId, 'agent-extension');
    } catch (_error) {
      TraceReporter.emit(result?.requestId ?? '', 'agent_response_send_failed', result?.skillId ?? '',
        'agent-extension', 'ERR_REPORT_FAILED');
    }
  }

  async handle(data: string): Promise<string> {
    // 自测可检查决策结果；组件回包必须使用 receive，以执行去重与关闭连接策略。
    return JSON.stringify((await this.process(data)).result);
  }

  static rejectUnconnected(data: string, sender: AgentResponseSender): void {
    let requestId: string = '';
    if (data.length > 0 && data.length <= MAX_ENVELOPE_LENGTH) {
      try {
        const parsed = JSON.parse(data) as Object;
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const id = (parsed as Record<string, Object>)['requestId'];
          if (typeof id === 'string' && id.trim().length > 0 &&
            id.length <= MAX_REQUEST_ID_LENGTH && id === id.trim()) {
            requestId = id;
          }
        }
      } catch (_error) {
        // 拒绝路径只尝试恢复可用 ID，不创建连接或执行业务。
      }
    }
    const result = failedResult(requestId, '', 'ERR_NOT_CONNECTED',
      '连接未被接受或已关闭，请重新连接', 'agent-extension');
    try {
      sender.sendData(JSON.stringify(result));
      TraceReporter.emit(requestId, 'agent_request_rejected', '', 'agent-extension', result.errCode);
    } catch (_error) {
      TraceReporter.emit(requestId, 'agent_response_send_failed', '', 'agent-extension', 'ERR_REPORT_FAILED');
    }
  }

  private outcome(result: SkillResult, send: boolean = true): BridgeOutcome {
    return { result: result, send: send };
  }

  private async process(data: string): Promise<BridgeOutcome> {
    if (!this.open) {
      return this.outcome(this.invalidRequest('连接已关闭'));
    }
    if (data.length === 0 || data.length > MAX_ENVELOPE_LENGTH) {
      return this.outcome(this.invalidRequest('外部请求长度无效'));
    }

    let parsed: Object;
    try {
      parsed = JSON.parse(data) as Object;
    } catch (_error) {
      return this.outcome(this.invalidRequest('请求必须为有效 JSON'));
    }

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return this.outcome(this.invalidRequest('请求必须为 JSON 对象'));
    }

    const record = parsed as Record<string, Object>;
    const requestId = record['requestId'];
    const text = record['text'];
    if (typeof requestId !== 'string' || requestId.trim().length === 0 ||
      requestId.length > MAX_REQUEST_ID_LENGTH || requestId !== requestId.trim()) {
      return this.outcome(this.invalidRequest('requestId 必须为 1–128 码元且无首尾空白的字符串'));
    }
    if (this.requestIds.has(requestId)) {
      return this.outcome(this.invalidRequest('同一连接不能重复使用 requestId', requestId), false);
    }
    if (typeof text !== 'string' ||
      text.trim().length === 0 || text.length > 1100 ||
      Object.keys(record).some((key: string): boolean => key !== 'requestId' && key !== 'text')) {
      return this.outcome(this.invalidRequest('text 或字段不符合接口契约', requestId));
    }
    if (this.pending >= 8 || this.requestIds.size >= 128) {
      return this.outcome(this.invalidRequest('连接请求上限已达到，请等待或重新连接', requestId));
    }

    const request: AgentRequest = { requestId: requestId, text: text };
    this.requestIds.add(requestId);
    this.pending += 1;
    TraceReporter.emit(requestId, 'agent_data_received', '', 'agent-extension');
    try {
      return this.outcome(await this.agent.handle(request));
    } catch (_error) {
      return this.outcome(failedResult(requestId, '', 'ERR_INTERNAL',
        'Agent 执行失败', 'agent-extension'));
    } finally {
      this.pending -= 1;
    }
  }

  private invalidRequest(message: string, requestId: string = ''): SkillResult {
    TraceReporter.emit(requestId, 'agent_request_rejected', '', 'agent-extension', 'ERR_INVALID_PARAMS');
    return failedResult(requestId, '', 'ERR_INVALID_PARAMS', message, 'agent-extension');
  }
}
