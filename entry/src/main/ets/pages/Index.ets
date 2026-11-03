import { AgentService } from '../agent/AgentService';
import { AgentRequest } from '../agent/Contracts';

@Entry
@Component
struct Index {
  @State input: string = '回显 你好，鸿蒙';
  @State output: string = '输入指令后点击运行';
  @State running: boolean = false;
  private agent: AgentService = new AgentService();
  private sequence: number = 0;

  private async run(): Promise<void> {
    this.running = true;
    this.sequence += 1;
    const request: AgentRequest = {
      requestId: `ui-${Date.now()}-${this.sequence}`,
      text: this.input
    };
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
          .onChange((value: string) => { this.input = value; })
        Button(this.running ? '执行中' : '运行')
          .enabled(!this.running)
          .onClick(() => { this.run(); })
        Text('支持：回显 文本；长度 文本').fontSize(14)
        Text(this.output).fontSize(14).width('100%').copyOption(CopyOptions.InApp)
      }.padding(24).width('100%')
    }.width('100%').height('100%')
  }
}
