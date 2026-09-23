import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { generateThemeMetadata } from './theme-metadata.mjs';

const require = createRequire(import.meta.url);

const tokensPath = new URL('../src/tokens.css', import.meta.url);
const metadataPath = new URL('../theme/smbc-theme.metadata.json', import.meta.url);
const packagePath = require.resolve('devextreme-themebuilder/package.json');

const css = await readFile(tokensPath, 'utf8');
const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
const themeBuilderPackage = JSON.parse(await readFile(packagePath, 'utf8'));

const generated = generateThemeMetadata(css, metadata, themeBuilderPackage.version);
await writeFile(metadataPath, `${JSON.stringify(generated, null, 2)}\n`);
