// 无依赖的静态检查。仅验证工程组织与契约引用，不执行或编译 ArkTS。
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(path, 'utf8');
const config = (path) => JSON.parse(read(join(root, path)));
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (['.git', '.hvigor', '.idea', 'oh_modules', 'node_modules', 'build'].includes(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
}

try {
  walk(root);
  for (const path of files.filter((file) => ['.json', '.json5'].includes(extname(file)))) {
    // 本仓库的 JSON5 有意使用 JSON 子集；若引入 JSON5 扩展语法需同时升级解析器。
    JSON.parse(read(path));
  }
  const modulePath = join(root, 'entry/src/main/module.json5');
  const module = config('entry/src/main/module.json5').module;
  const app = config('AppScope/app.json5').app;
  const build = config('build-profile.json5');
  assert.equal(config('entry/build-profile.json5').apiType, 'stageMode');
  assert.equal(build.app.products[0].targetSdkVersion, '26.0.0');
  assert.equal(build.app.products[0].compatibleSdkVersion, '26.0.0');
  assert.equal(config('hvigor/hvigor-config.json5').modelVersion, '26.0.0');
  for (const entry of build.modules) {
    assert.ok(existsSync(join(root, entry.srcPath, 'build-profile.json5')), `模块不存在：${entry.name}`);
  }
  for (const ability of module.abilities) {
    assert.ok(existsSync(resolve(dirname(modulePath), ability.srcEntry)), `Ability 入口不存在：${ability.name}`);
  }
  const extension = module.extensionAbilities.find((item) => item.type === 'agent');
  assert.ok(extension, '缺少 AgentExtensionAbility 注册');
  assert.equal(extension.exported, false, '调用方认证未核验前保持非导出');
  assert.ok(existsSync(resolve(dirname(modulePath), extension.srcEntry)), 'Agent 组件入口不存在');
  const agentMetadata = extension.metadata.find((item) => item.name === 'ohos.extension.agent');
  assert.equal(agentMetadata.resource, '$profile:agent_config');
  const card = config('entry/src/main/resources/base/profile/agent_config.json').agentCards[0];
  assert.equal(card.appInfo.bundleName, app.bundleName);
  assert.equal(card.appInfo.moduleName, module.name);
  assert.equal(card.appInfo.abilityName, extension.name);
  assert.deepEqual(card.skills.map((item) => item.id).sort(), module.skillProfiles.map((item) => item.name).sort());
  const profiles = module.skillProfiles;
  const names = new Set();
  for (const profile of profiles) {
    assert.match(profile.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!names.has(profile.name), `重复 Skill：${profile.name}`);
    names.add(profile.name);
    assert.ok(module.abilities.some((item) => item.name === profile.abilityName), `Skill 绑定 Ability 不存在：${profile.name}`);
    const skillDir = join(root, 'entry/skills', profile.name);
    const markdown = read(join(skillDir, 'SKILL.md'));
    assert.match(markdown, new RegExp(`^---\\r?\\nname: ${profile.name}\\r?\\n`));
    const commands = [...markdown.matchAll(/--scriptPath '([^']+)' --functionName '([^']+)'/g)];
    assert.ok(commands.length > 0, `Skill 无调用声明：${profile.name}`);
    for (const path of profile.srcEntries) {
      const entry = resolve(dirname(modulePath), path);
      assert.equal(dirname(entry), join(skillDir, 'scripts'));
      assert.equal(extname(entry), '.ets');
      assert.ok(existsSync(entry), `Skill 脚本不存在：${entry}`);
      assert.ok(commands.some((command) => resolve(skillDir, command[1]) === entry));
    }
    for (const [, path, method] of commands) {
      const entry = resolve(skillDir, path);
      assert.ok(profile.srcEntries.some((source) => resolve(dirname(modulePath), source) === entry));
      assert.match(read(entry), /export default class /);
      assert.match(read(entry), new RegExp(`public async ${method}\\(info: scriptManager\\.ArkTSScriptInfo`));
    }
    const blocks = [...markdown.matchAll(/```json\r?\n([\s\S]*?)```/g)].map((match) => JSON.parse(match[1]));
    assert.ok(blocks.some((block) => block.args?.required?.includes('arg1')), `Skill 缺少 arg1 契约：${profile.name}`);
  }
  assert.equal(profiles.length, readdirSync(join(root, 'entry/skills')).length);

  // 检查声明的资源，避免构建阶段才发现图片、页面或字符串丢失。
  const resourceRoots = [join(root, 'entry/src/main/resources/base'), join(root, 'AppScope/resources/base')];
  for (const value of [...Object.values(app), ...Object.values(module), ...module.abilities.flatMap(Object.values)]) {
    if (typeof value !== 'string' || !value.startsWith('$')) continue;
    const [, type, name] = value.match(/^\$(\w+):(.+)$/) ?? [];
    assert.ok(type && name, `资源格式错误：${value}`);
    assert.ok(resourceRoots.some((base) => {
      if (type === 'string' || type === 'color') {
        const path = join(base, 'element', `${type}.json`);
        return existsSync(path) && JSON.parse(read(path))[type].some((item) => item.name === name);
      }
      return ['.json', '.svg', '.png'].some((extension) => existsSync(join(base, type, name + extension)));
    }), `资源不存在：${value}`);
  }
  for (const page of config('entry/src/main/resources/base/profile/main_pages.json').src) {
    assert.ok(existsSync(join(root, 'entry/src/main/ets', page + '.ets')), `页面不存在：${page}`);
  }

  for (const path of files) {
    if (['.ets', '.ts'].includes(extname(path))) {
      for (const [, target] of read(path).matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
        if (!target.startsWith('.')) continue;
        const source = resolve(dirname(path), target);
        assert.ok(['', '.ets', '.ts'].some((extension) => existsSync(source + extension)), `源码引用不存在：${relative(root, path)} -> ${target}`);
      }
    }
    if (extname(path) !== '.md') continue;
    const prose = read(path).replace(/```[\s\S]*?```/g, '');
    for (const [, target] of prose.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
      const destination = decodeURIComponent(target.split('#')[0]);
      assert.ok(existsSync(resolve(dirname(path), destination)), `文档链接不存在：${relative(root, path)} -> ${target}`);
    }
  }
  console.log(`PASS: ${files.length} files; ${profiles.length} Skill profiles; config, resources, imports and Markdown links checked.`);
  console.log('Static checks only. ArkTS build, install, runtime and system invocation are NOT verified.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
