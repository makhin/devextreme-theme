import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const packageRoot = fileURLToPath(new URL('..', import.meta.url));
// The CLI's reader expects node_modules in its cwd. Resolve the actual install
// location so both hoisted workspaces and standalone installs work.
const builderRoot = dirname(require.resolve('devextreme-themebuilder/package.json'));
execFileSync(process.execPath, [
  require.resolve('devextreme-cli/index.js'), 'build-theme',
  '--input-file', resolve(packageRoot, 'theme/smbc-theme.metadata.json'),
  '--output-file', resolve(packageRoot, 'src/dx.smbc.css'),
  '--remove-external-resources',
], { cwd: resolve(builderRoot, '../..'), stdio: 'inherit' });
