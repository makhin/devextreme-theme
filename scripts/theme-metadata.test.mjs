import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { generateThemeMetadata } from './theme-metadata.mjs';

const tokens = await readFile(new URL('../src/tokens.css', import.meta.url), 'utf8');
const metadata = JSON.parse(await readFile(new URL('../theme/smbc-theme.metadata.json', import.meta.url), 'utf8'));
const withPrimary = value => tokens.replace(/--color-action-primary:[^;]+;/, `--color-action-primary: ${value};`);
const generate = css => generateThemeMetadata(css, metadata, '26.1.4');
const accent = result => result.items.find(item => item.key === '$base-accent').value;

test('propagates changed tokens through nested aliases', () => {
  const css = withPrimary('var(--test-alias)') + '\n:root { --test-alias: var(--test-color); --test-color: #123456; }';
  assert.equal(accent(generate(css)), '#123456');
  assert.equal(accent(generate(withPrimary('#abcdef'))), '#abcdef');
});

test('rejects missing references', () => {
  assert.throws(() => generate(withPrimary('var(--missing-test-token)')),
    /Missing required design token: --missing-test-token/);
});

test('rejects direct and indirect cycles', () => {
  assert.throws(() => generate(withPrimary('var(--color-action-primary)')),
    /Circular design token reference: color-action-primary -> color-action-primary/);
  const css = withPrimary('var(--test-alias)') + '\n:root { --test-alias: var(--color-action-primary); }';
  assert.throws(() => generate(css),
    /Circular design token reference: color-action-primary -> test-alias -> color-action-primary/);
});

test('replaces obsolete and duplicate items while preserving settings and inputs', () => {
  const input = structuredClone(metadata);
  input.items.push({ key: '$obsolete-setting', value: 'old' }, { key: '$base-accent', value: 'old' });
  input.items.reverse();
  const original = structuredClone(input);
  const result = generateThemeMetadata(tokens, input, 'test-version');
  assert.deepEqual(input, original);
  assert.notEqual(result, input);
  assert.notEqual(result.items, input.items);
  assert.equal(result.version, 'test-version');
  assert.equal(result.items.some(item => item.key === '$obsolete-setting'), false);
  assert.equal(result.items.filter(item => item.key === '$base-accent').length, 1);
  const { items: oldItems, version: oldVersion, ...oldSettings } = input;
  const { items: newItems, version: newVersion, ...newSettings } = result;
  assert.deepEqual(newSettings, oldSettings);
  assert.deepEqual(result, generateThemeMetadata(tokens, result, 'test-version'));
});

test('preserves current mapped values and font normalization', () => {
  const byKey = items => Object.fromEntries(items.map(({ key, value }) => [key, value]));
  assert.deepEqual(byKey(generate(tokens).items), byKey(metadata.items));
  assert.equal(generate(tokens).items.find(item => item.key === '$base-font-family').value,
    'myriad-pro, Myriad Pro, Arial, sans-serif');
});
