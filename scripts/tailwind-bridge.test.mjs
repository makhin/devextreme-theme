import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const bridge = readFileSync(new URL('../src/tailwind.css', import.meta.url), 'utf8');
const tokens = readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf8');
test('Tailwind aliases reference canonical tokens without introducing visual values', () => {
  assert.match(bridge, /@theme inline/);
  assert.match(bridge, /--color-\*: initial/);
  const canonical = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const definitions = [...bridge.matchAll(/(--[\w*-]+)\s*:\s*([^;]+);/g)];
  assert(definitions.length > 60);
  for (const [, alias, value] of definitions) {
    if (alias.includes('*')) {
      assert.equal(value, 'initial');
      continue;
    }
    const reference = /^var\((--[\w-]+)\)$/.exec(value);
    assert(reference, `${alias} must be an alias, not a new design value`);
    assert(canonical.has(reference[1]), `${alias} references a missing canonical token`);
  }
  assert(!/@import|@source|@tailwind/.test(bridge), 'Bridge must not import Tailwind or scan consumers');
});
