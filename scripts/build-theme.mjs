import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { buildTheme } from 'devextreme-themebuilder';
import { generateThemeMetadata } from './theme-metadata.mjs';

const require = createRequire(import.meta.url);
const metadataPath = new URL('../theme/smbc-theme.metadata.json', import.meta.url);
const tokens = await readFile(new URL('../src/tokens.css', import.meta.url), 'utf8');
const previous = JSON.parse(await readFile(metadataPath, 'utf8'));
const { version } = JSON.parse(await readFile(require.resolve('devextreme-themebuilder/package.json'), 'utf8'));
const metadata = generateThemeMetadata(tokens, previous, version);
const { css } = await buildTheme({ ...metadata, removeExternalResources: true });

await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
await writeFile(new URL('../src/dx.smbc.css', import.meta.url), css);
