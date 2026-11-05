import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sha256 } from './evidence.mjs';

/** Include tracked and untracked source files so additions and deletions change the fingerprint. */
export function captureSource(root) {
  const paths = [...new Set(execFileSync('git', ['ls-files', '-c', '-o', '--exclude-standard', '-z'],
    { cwd: root, encoding: 'utf8', windowsHide: true }).split('\0').filter(Boolean))]
    .filter(path => /^(?:AppScope\/|entry\/|hvigor\/|tools\/|\.github\/|build-profile\.json5$|oh-package\.json5$|hvigorfile\.ts$)/.test(path) ||
      /^docs\/records\/[^/]+\/check-[^/]+\.mjs$/.test(path))
    .sort();
  const files = paths.map(path => ({ path, sha256: sha256(readFileSync(join(root, path))) }));
  return { files, fingerprint: sha256(JSON.stringify(files)) };
}
