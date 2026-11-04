import { AgentService } from '../agent/AgentService';
import { AgentRequest, SkillResult, failedResult } from '../agent/Contracts';
import { TraceReporter } from '../agent/TraceReporter';

const MAX_ENVELOPE_LENGTH: number = 8192;
const MAX_REQUEST_ID_LENGTH: number = 128;

export interface AgentResponseSender {
  sendData(data: string): void;
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
      const response = await this.handle(data);
      result = JSON.parse(response) as SkillResult;
      if (!this.open) {
        TraceReporter.emit(result.requestId, 'agent_response_dropped', result.skillId, 'agent-extension');
        return;
      }
      sender.sendData(response);
      TraceReporter.emit(result.requestId, 'agent_response_sent', result.skillId, 'agent-extension');
    } catch (_error) {
      TraceReporter.emit(result?.requestId ?? '', 'agent_response_send_failed', result?.skillId ?? '',
        'agent-extension', 'ERR_REPORT_FAILED');
    }
  }

  async handle(data: string): Promise<string> {
    if (!this.open) {
      return JSON.stringify(this.invalidRequest('连接已关闭'));
    }
    if (data.length === 0 || data.length > MAX_ENVELOPE_LENGTH) {
      return JSON.stringify(this.invalidRequest('外部请求长度无效'));
    }

    let parsed: Object;
    try {
      parsed = JSON.parse(data) as Object;
    } catch (_error) {
      return JSON.stringify(this.invalidRequest('请求必须为有效 JSON'));
    }

    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return JSON.stringify(this.invalidRequest('请求必须为 JSON 对象'));
    }

    const record = parsed as Record<string, Object>;
    const requestId = record['requestId'];
    const text = record['text'];
    if (typeof requestId !== 'string' || requestId.trim().length === 0 ||
      requestId.length > MAX_REQUEST_ID_LENGTH || requestId !== requestId.trim()) {
      return JSON.stringify(this.invalidRequest('requestId 必须为 1–128 码元且无首尾空白的字符串'));
    }
    if (typeof text !== 'string' ||
      text.trim().length === 0 || text.length > 1100 ||
      Object.keys(record).some((key: string): boolean => key !== 'requestId' && key !== 'text')) {
      return JSON.stringify(this.invalidRequest('text 或字段不符合接口契约', requestId));
    }
    if (this.requestIds.has(requestId)) {
      return JSON.stringify(this.invalidRequest('同一连接不能重复使用 requestId', requestId));
    }
    if (this.pending >= 8 || this.requestIds.size >= 128) {
      return JSON.stringify(this.invalidRequest('连接请求上限已达到，请等待或重新连接', requestId));
    }

    const request: AgentRequest = { requestId: requestId, text: text };
    this.requestIds.add(requestId);
    this.pending += 1;
    TraceReporter.emit(requestId, 'agent_data_received', '', 'agent-extension');
    try {
      return JSON.stringify(await this.agent.handle(request));
    } catch (_error) {
      return JSON.stringify(failedResult(requestId, '', 'ERR_INTERNAL',
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
