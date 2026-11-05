import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const sha256 = value => createHash('sha256').update(value).digest('hex');

/** Run local Node checks only. No shell, retries, device commands or remote writes. */
export async function executeChecks(checks, { cwd, outputDir }) {
  if (existsSync(outputDir)) throw new Error('Evidence output directory already exists. Choose a new run directory.');
  const names = new Set();
  for (const check of checks) {
    if (!/^[a-z][a-z0-9-]*$/.test(check.name) || names.has(check.name)) throw new Error('Invalid or duplicate check name.');
    if (check.timeoutMs !== undefined && (!Number.isInteger(check.timeoutMs) || check.timeoutMs <= 0)) throw new Error('Invalid timeout.');
    names.add(check.name);
  }
  mkdirSync(outputDir, { recursive: true });
  const results = [];
  for (const check of checks) {
    const started = Date.now();
    const chunks = [];
    let timedOut = false;
    let error = '';
    const child = spawn(check.command, check.args, { cwd, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', chunk => chunks.push(chunk));
    child.stderr.on('data', chunk => chunks.push(chunk));
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, check.timeoutMs ?? 120000);
    child.on('error', value => { error = value.message; });
    const { exitCode, signal } = await new Promise(resolve => child.on('close', (exitCode, signal) => resolve({ exitCode, signal })));
    clearTimeout(timer);
    const log = Buffer.concat(chunks).toString('utf8') + (error ? `\nLaunch error: ${error}\n` : '') + (timedOut ? '\nCHECK TIMED OUT\n' : '');
    const logFile = `${check.name}.log`;
    writeFileSync(join(outputDir, logFile), log);
    results.push({ name: check.name, status: timedOut ? 'timeout' : exitCode === 0 && !error ? 'passed' : 'failed',
      exitCode, signal, error, durationMs: Date.now() - started, logFile, sha256: sha256(log) });
  }
  return results;
}
