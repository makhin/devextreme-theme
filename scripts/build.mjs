import { cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
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
  if (file.endsWith('.css')) {
    // Imported inside a cascade layer, a nested @charset is invalid and unnecessary for UTF-8 assets.
    const css = await readFile(resolve(root, 'src', file), 'utf8');
    await writeFile(resolve(dist, file), css.replace(/^@charset [^;]+;\s*/gm, ''));
  }
}
const icons = resolve(dirname(require.resolve('devextreme/package.json')), 'dist/css/icons');
await mkdir(resolve(dist, 'assets/icons'), { recursive: true });
for (const extension of ['woff2', 'woff', 'ttf']) {
  const name = `dxiconsfluent.${extension}`;
  await cp(resolve(icons, name), resolve(dist, 'assets/icons', name));
}
