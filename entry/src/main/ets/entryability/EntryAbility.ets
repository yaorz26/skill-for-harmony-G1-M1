import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (error) => {
      if (error.code) {
        console.error(`[G1M1] loadContent failed: ${error.code}`);
        return;
      }
      console.info('[G1M1] {"stage":"page_loaded","page":"pages/Index"}');
    });
  }
}
