import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'smbc-package-test-'));
try {
  // Exercise synchronization against isolated source fixtures, never live tokens.
  const source = join(temp, 'source');
  for (const folder of ['src', 'theme', 'scripts', 'node_modules/devextreme-themebuilder']) {
    await mkdir(join(source, folder), { recursive: true });
  }
  await cp(join(packageRoot, 'scripts/sync-devextreme-theme.mjs'), join(source, 'scripts/sync-devextreme-theme.mjs'));
  await cp(join(packageRoot, 'theme/smbc-theme.metadata.json'), join(source, 'theme/smbc-theme.metadata.json'));
  await writeFile(join(source, 'node_modules/devextreme-themebuilder/package.json'), JSON.stringify({ version: '26.1.4' }));
  const tokens = await readFile(join(packageRoot, 'src/tokens.css'), 'utf8');
  for (const [value, error] of [
    ['var(--missing-test-token)', /Missing required design token: --missing-test-token/],
    ['var(--color-action-primary)', /Circular design token reference/],
    ['#123456', null],
  ]) {
    await writeFile(join(source, 'src/tokens.css'), tokens.replace(/--color-action-primary:[^;]+;/, `--color-action-primary: ${value};`));
    const sync = () => execFileSync(process.execPath, ['scripts/sync-devextreme-theme.mjs'], { cwd: source, stdio: 'pipe' });
    if (error) assert.throws(sync, error);
    else {
      sync();
      const metadata = JSON.parse(await readFile(join(source, 'theme/smbc-theme.metadata.json'), 'utf8'));
      assert.equal(metadata.items.find(item => item.key === '$base-accent').value, '#123456');
    }
  }
  console.log('Metadata synchronization: token propagation, missing references and cycles passed.');
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temp], {
    cwd: packageRoot, encoding: 'utf8',
  }));
  await writeFile(join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(temp, pack.filename), 'devextreme@26.1.4'], {
    cwd: temp, stdio: 'inherit',
  });
  await writeFile(join(temp, 'node-check.mjs'), `
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
const { getPalette } = await import('devextreme/cjs/viz/palette.js');
const originalPalette = structuredClone(getPalette('SMBC'));
Object.defineProperty(globalThis, 'document', { configurable: true, get() { throw new Error('DOM accessed on import'); } });
await import('@smbc/devextreme-theme');
const { smbcLogoUrl, smbcFaviconUrl } = await import('@smbc/devextreme-theme/assets');
const { registerSmbcVizPalette, SMBC_VIZ_PALETTE_NAME } = await import('@smbc/devextreme-theme/viz');
assert.deepEqual(getPalette('SMBC'), originalPalette, 'Import must not register a palette');
await access(new URL(smbcLogoUrl));
await access(new URL(smbcFaviconUrl));
delete globalThis.document;
assert.throws(registerSmbcVizPalette, /requires a browser document/);
globalThis.document = { documentElement: {} };
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
assert.throws(registerSmbcVizPalette, /Missing required design token: --color-data-series-1/);
const colors = Array.from({ length: 7 }, (_, i) => '#00000' + i);
globalThis.getComputedStyle = () => ({ getPropertyValue: name => name.startsWith('--color-data-series-') ? colors[Number(name.slice(-1)) - 1] : '#123456' });
registerSmbcVizPalette();
assert.deepEqual(getPalette(SMBC_VIZ_PALETTE_NAME).simpleSet, colors);
console.log('Installed tarball: Node imports, asset URLs, palette registration and error contracts passed.');
`);
  execFileSync(process.execPath, ['node-check.mjs'], { cwd: temp, stdio: 'inherit' });
  await writeFile(join(temp, 'index.html'), '<html><head></head><body class="dx-viewport"><script type="module" src="/main.js"></script></body></html>');
  await writeFile(join(temp, 'main.js'), `
import '@smbc/devextreme-theme/styles.css';
import { smbcLogoUrl, smbcFaviconUrl } from '@smbc/devextreme-theme/assets';
import directLogo from '@smbc/devextreme-theme/assets/smbc-logo.svg';
import directIcon from '@smbc/devextreme-theme/assets/favicon.ico';
import { registerSmbcVizPalette, SMBC_VIZ_PALETTE_NAME } from '@smbc/devextreme-theme/viz';
import { getPalette } from 'devextreme/viz/palette';
registerSmbcVizPalette();
window.smbc = { smbcLogoUrl, smbcFaviconUrl, directLogo, directIcon, palette: getPalette(SMBC_VIZ_PALETTE_NAME) };
`);
  await build({ root: temp, configFile: false, base: '/nested/', logLevel: 'warn', build: { assetsInlineLimit: 0 } });
  const assets = join(temp, 'dist/assets');
  const files = await readdir(assets);
  for (const prefix of ['smbc-logo-', 'favicon-', 'myriad-pro-light-', 'myriad-pro-regular-', 'myriad-pro-bold-', 'capitolium-2-bold-', 'dxiconsfluent-']) {
    assert(files.some(name => name.startsWith(prefix)), `Missing bundled asset ${prefix}`);
  }
  const css = await readFile(join(assets, files.find(name => name.endsWith('.css'))), 'utf8');
  for (const [, url] of css.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) {
    if (url.startsWith('data:')) continue;
    assert(url.startsWith('/nested/assets/'), `Bad deployment URL: ${url}`);
    assert(files.includes(url.split('/').at(-1)), `Missing CSS resource ${url}`);
  }
  assert(css.includes('--color-action-primary:'), 'CSS-only import was tree-shaken');
  const js = await readFile(join(assets, files.find(name => name.endsWith('.js'))), 'utf8');
  for (const prefix of ['smbc-logo-', 'favicon-']) {
    assert(js.includes('/nested/assets/' + files.find(name => name.startsWith(prefix))), `Bad asset helper URL for ${prefix}`);
  }
  console.log('Installed tarball: Vite CSS, direct exports, brand/font assets and non-root deployment URLs passed.');
  // Optional retained fixture for browser verification.
  if (process.env.SMBC_KEEP_TEST_FIXTURE) console.log(`Fixture: ${temp}`);
} finally {
  if (!process.env.SMBC_KEEP_TEST_FIXTURE) await rm(temp, { recursive: true, force: true });
}
