import { readFile, writeFile } from 'node:fs/promises';
import { buildTheme } from 'devextreme-themebuilder';

const metadata = JSON.parse(await readFile(new URL('../theme/smbc-theme.metadata.json', import.meta.url), 'utf8'));
const { css } = await buildTheme({ ...metadata, removeExternalResources: true });
await writeFile(new URL('../src/dx.smbc.css', import.meta.url), css);
