import { AgentExtensionAbility, common, Want } from '@kit.AbilityKit';
import { AgentRequestBridge, AgentResponseSender } from './AgentRequestBridge';
import { TraceReporter } from '../agent/TraceReporter';

class HostResponseSender implements AgentResponseSender {
  private proxy: common.AgentHostProxy;

  constructor(proxy: common.AgentHostProxy) {
    this.proxy = proxy;
  }

  sendData(data: string): void {
    try {
      this.proxy.sendData(data);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Agent host response failed');
    }
  }
}

export default class G1M1AgentExtensionAbility extends AgentExtensionAbility {
  private connections: Map<common.AgentHostProxy, AgentRequestBridge> = new Map();

  onCreate(want: Want): void {
    console.info(`[G1M1] ${JSON.stringify({
      stage: 'agent_extension_created',
      abilityName: want.abilityName ?? ''
    })}`);
  }

  onConnect(want: Want, proxy: common.AgentHostProxy): void {
    // Want 的 bundleName/abilityName 是连接目标信息，不能据此认定调用方身份。
    this.connections.get(proxy)?.close();
    if (!this.connections.has(proxy) && this.connections.size >= 8) {
      TraceReporter.emit('', 'agent_request_rejected', '', 'agent-extension', 'ERR_CONNECTION_LIMIT');
      return;
    }
    this.connections.set(proxy, new AgentRequestBridge());
    console.info(`[G1M1] ${JSON.stringify({
      stage: 'agent_connected',
      bundleName: want.bundleName ?? '',
      abilityName: want.abilityName ?? ''
    })}`);
  }

  onData(proxy: common.AgentHostProxy, data: string): void {
    const bridge = this.connections.get(proxy);
    if (bridge === undefined) {
      AgentRequestBridge.rejectUnconnected(data, new HostResponseSender(proxy));
      return;
    }
    void bridge.receive(data, new HostResponseSender(proxy));
  }

  onAuth(_proxy: common.AgentHostProxy, _handshakeData: string): void {
    // 未核验受支持调用方的认证协议，不回显握手数据、不调用 authorize 假装认证成功。
    TraceReporter.emit('', 'agent_auth_not_configured', '', 'agent-extension');
  }

  onDisconnect(want: Want, proxy: common.AgentHostProxy): void {
    this.connections.get(proxy)?.close();
    this.connections.delete(proxy);
    console.info(`[G1M1] ${JSON.stringify({
      stage: 'agent_disconnected',
      bundleName: want.bundleName ?? '',
      abilityName: want.abilityName ?? ''
    })}`);
  }

  onDestroy(): void {
    this.connections.forEach((bridge: AgentRequestBridge): void => { bridge.close(); });
    this.connections.clear();
    TraceReporter.emit('', 'agent_extension_destroyed', '', 'agent-extension');
  }
}
