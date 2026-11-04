import { AgentService } from '../agent/AgentService';
import { AgentRequest } from '../agent/Contracts';

@Entry
@Component
struct Index {
  @State input: string = '回显 你好，鸿蒙';
  @State output: string = '输入指令后点击运行';
  @State running: boolean = false;
  @State supported: string = '';
  @State requestId: string = '';
  private agent: AgentService = new AgentService();
  private sequence: number = 0;

  aboutToAppear(): void {
    this.supported = this.agent.supportedHint();
  }

  private async run(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    this.sequence += 1;
    const request: AgentRequest = {
      requestId: `ui-${Date.now()}-${this.sequence}`,
      text: this.input
    };
    this.requestId = request.requestId;
    try {
      const result = await this.agent.handle(request);
      this.output = JSON.stringify(result, null, 2);
    } catch (e) {
      this.output = '执行异常，请查看运行日志';
    } finally {
      this.running = false;
    }
  }

  build() {
    Scroll() {
      Column({ space: 16 }) {
        Text('Skill Agent Demo').fontSize(26).fontWeight(FontWeight.Bold)
        Text('应用内框架演示').fontSize(16)
        TextInput({ text: this.input, placeholder: '例如：长度 你好ABC' })
          .enabled(!this.running)
          .onChange((value: string) => { this.input = value; })
        Row({ space: 8 }) {
          Button('回显示例').enabled(!this.running)
            .onClick(() => { this.input = '回显 你好，鸿蒙'; })
          Button('长度示例').enabled(!this.running)
            .onClick(() => { this.input = '长度 你好ABC'; })
          Button('未命中示例').enabled(!this.running)
            .onClick(() => { this.input = '查天气'; })
        }
        Button(this.running ? '执行中' : '运行')
          .enabled(!this.running)
          .onClick(() => { this.run(); })
        Text(this.supported).fontSize(14)
        if (this.requestId.length > 0) {
          Text(`请求：${this.requestId}`).fontSize(12).copyOption(CopyOptions.InApp)
        }
        Text(this.output).fontSize(14).width('100%').copyOption(CopyOptions.InApp)
      }.padding(24).width('100%')
    }.width('100%').height('100%')
  }
}
