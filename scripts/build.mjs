import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', resolve(root, 'tsconfig.json')], { stdio: 'inherit' });
for (const file of await readdir(resolve(root, 'src'))) {
  if (file.endsWith('.css')) await cp(resolve(root, 'src', file), resolve(dist, file));
}
await cp(resolve(root, 'assets'), resolve(dist, 'assets'), { recursive: true });
const icons = resolve(dirname(require.resolve('devextreme/package.json')), 'dist/css/icons');
await mkdir(resolve(dist, 'assets/icons'), { recursive: true });
for (const extension of ['woff2', 'woff', 'ttf']) {
  const name = `dxiconsfluent.${extension}`;
  await cp(resolve(icons, name), resolve(dist, 'assets/icons', name));
}
