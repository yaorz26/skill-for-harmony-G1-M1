import { SkillDescriptor } from '../agent/Contracts';

export class SkillRegistry {
  // 只允许应用内显式注册的能力；本目录不是系统 Skill 发现服务。
  list(): SkillDescriptor[] {
    return [
      { id: 'g1-echo', name: '回显', prefixes: ['回显', 'echo'] },
      { id: 'g1-text-length', name: '文本长度', prefixes: ['长度', '字数', 'length'] }
    ];
  }

  contains(skillId: string): boolean {
    for (const descriptor of this.list()) {
      if (descriptor.id === skillId) {
        return true;
      }
    }
    return false;
  }
}
