import { runNpm } from './run-npm.mjs';

function config(key) {
  return runNpm(['config', 'get', key], { encoding: 'utf8' }).trim();
}
const scopedRegistry = config('@smbc:registry');
const registry = new URL(scopedRegistry === 'undefined' ? config('registry') : scopedRegistry);
if (!['http:', 'https:'].includes(registry.protocol)
    || /(^|\.)npmjs\.(org|com)$/i.test(registry.hostname.replace(/\.$/, ''))) {
  throw new Error('Internal assets: configure @smbc:registry for the approved internal registry before publishing.');
}
