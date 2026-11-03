import { SkillDescriptor } from '../agent/Contracts';

const SKILL_ID_PATTERN: RegExp = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// 允许前缀内部包含普通空格（如多词指令“查 天气”），但禁止路由层不予匹配的制表符、换行与全角空格。
const FORBIDDEN_PREFIX_WHITESPACE: RegExp = /[\t\r\n\u3000]/;

// 应用内显式注册的能力白名单目录；本目录不是系统 Skill 发现服务。
export class SkillRegistry {
  private descriptors: SkillDescriptor[];

  /** 校验并初始化能力白名单，保存防御性副本以隔离外部数组引用。 */
  constructor(descriptors: SkillDescriptor[] = SkillRegistry.builtIn()) {
    SkillRegistry.validate(descriptors);
    this.descriptors = SkillRegistry.copy(descriptors);
  }

  /** 返回框架默认内置的两个无网络样例 Skill 描述。 */
  static builtIn(): SkillDescriptor[] {
    return [
      { id: 'g1-echo', name: '回显', prefixes: ['回显', 'echo'] },
      { id: 'g1-text-length', name: '文本长度', prefixes: ['长度', '字数', 'length'] }
    ];
  }

  /** 返回全部已注册能力的深拷贝列表，防止调用方或自定义路由器原地篡改白名单。 */
  list(): SkillDescriptor[] {
    return SkillRegistry.copy(this.descriptors);
  }

  /** 按 skillId 查询单个已注册能力的副本；未注册时返回 undefined。 */
  get(skillId: string): SkillDescriptor | undefined {
    for (const descriptor of this.descriptors) {
      if (descriptor.id === skillId) {
        return { id: descriptor.id, name: descriptor.name, prefixes: descriptor.prefixes.slice() };
      }
    }
    return undefined;
  }

  /** 判断指定 skillId 是否在当前允许的白名单内。 */
  contains(skillId: string): boolean {
    for (const descriptor of this.descriptors) {
      if (descriptor.id === skillId) {
        return true;
      }
    }
    return false;
  }

  /** 根据当前注册表生成未命中意图时的支持指令提示文本。 */
  supportedHint(): string {
    if (this.descriptors.length === 0) {
      return '当前无已注册能力';
    }
    const items = this.descriptors.map((item: SkillDescriptor): string => `${item.prefixes[0]} 文本`);
    return `支持：${items.join('；')}`;
  }

  /** 复制描述项及其 prefixes 数组，阻断外部引用共享。 */
  private static copy(descriptors: SkillDescriptor[]): SkillDescriptor[] {
    return descriptors.map((item: SkillDescriptor): SkillDescriptor => {
      return { id: item.id, name: item.name, prefixes: item.prefixes.slice() };
    });
  }

  /** 校验目录不变量：id 小写连字符且唯一、名称非空、前缀无首尾或非法空白且区分大小写全局唯一。 */
  private static validate(descriptors: SkillDescriptor[]): void {
    const ids: Set<string> = new Set<string>();
    const prefixes: Set<string> = new Set<string>();
    for (const item of descriptors) {
      if (!SKILL_ID_PATTERN.test(item.id) || ids.has(item.id) ||
        item.name.trim().length === 0 || item.prefixes.length === 0) {
        throw new Error(`Skill 目录项不合法：${item.id}`);
      }
      ids.add(item.id);
      for (const prefix of item.prefixes) {
        if (prefix.length === 0 || prefix !== prefix.trim() ||
          FORBIDDEN_PREFIX_WHITESPACE.test(prefix) || prefixes.has(prefix)) {
          throw new Error(`Skill 前缀不合法或重复：${prefix}`);
        }
        prefixes.add(prefix);
      }
    }
  }
}
