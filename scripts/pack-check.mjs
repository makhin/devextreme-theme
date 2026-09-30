import assert from 'node:assert/strict';
import { runNpm } from './run-npm.mjs';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const [pack] = JSON.parse(runNpm(['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: fileURLToPath(root), encoding: 'utf8',
}));
const actual = pack.files.map(({ path }) => path).sort();
const expected = [
  'package.json', 'README.md',
  ...['index', 'viz', 'assets'].flatMap(name => [`dist/${name}.js`, `dist/${name}.d.ts`]),
  ...['styles', 'tokens', 'fonts', 'dx.smbc', 'overrides', 'tailwind'].map(name => `dist/${name}.css`),
  'dist/assets/smbc-logo.svg', 'dist/assets/favicon.ico',
  ...['myriad-pro-light', 'myriad-pro-regular', 'myriad-pro-bold', 'capitolium-2-bold'].map(name => `dist/assets/fonts/${name}.woff2`),
  ...['woff2', 'woff', 'ttf'].map(ext => `dist/assets/icons/dxiconsfluent.${ext}`),
].sort();
assert.deepEqual(actual, expected, 'Tarball must contain exactly the runtime contract and documentation');
assert.equal(manifest.name, '@smbc/devextreme-theme');
assert.equal(manifest.publishConfig.access, 'restricted');
for (const entry of Object.values(manifest.exports)) {
  for (const target of typeof entry === 'string' ? [entry] : Object.values(entry)) {
    assert(actual.includes(target.replace(/^\.\//, '')), `Missing export: ${target}`);
  }
}
for (const css of actual.filter(name => name.endsWith('.css'))) {
  const cssUrl = new URL(css, root);
  const text = await readFile(cssUrl, 'utf8');
  assert(!text.includes('node_modules'), `Install-layout-dependent path in ${css}`);
  for (const [, url] of text.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) {
    if (url.startsWith('data:')) continue;
    assert(!/^(?:https?:|\/)/.test(url), `Non-local resource in ${css}`);
    await access(new URL(url, cssUrl));
  }
}
console.log(`Verified ${actual.length} package files (${pack.size} bytes compressed):\n${actual.join('\n')}`);
