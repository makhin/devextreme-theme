import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function runNpm(args, options) {
  // npm supplies its CLI path to lifecycle scripts. Run it with Node so Windows
  // does not need to execute the npm.cmd wrapper, and arguments stay unquoted.
  const npmCli = process.env.npm_execpath;
  if (npmCli) return execFileSync(process.execPath, [npmCli, ...args], options);

  if (process.platform === 'win32') {
    const bundledCli = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
    if (existsSync(bundledCli)) {
      return execFileSync(process.execPath, [bundledCli, ...args], options);
    }
    throw new Error('Cannot locate npm CLI. Run this script through npm run (for example, npm run check).');
  }

  return execFileSync('npm', args, options);
}
