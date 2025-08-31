import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getBuiltinProviders, filterProvidersByIds, loadCustomProvider, validateProviderFile } from '../src/provider-loader.js';
import { makeTestDir } from './helpers/fs.js';

test('getBuiltinProviders returns known providers', async () => {
  const providers = await getBuiltinProviders();
  assert.ok(Array.isArray(providers));
  assert.equal(providers.length, 3);
  providers.forEach(p => {
    assert.equal(typeof p.id, 'string');
    assert.ok(p.id.length > 0);
    ['init', 'handle', 'finish'].forEach(m => assert.equal(typeof p[m], 'function'));
  });
});

test('filterProvidersByIds filters and validates ids', async () => {
  const providers = await getBuiltinProviders();
  const filtered = filterProvidersByIds(providers, [providers[0].id]);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, providers[0].id);
  assert.throws(() => filterProvidersByIds(providers, ['missing']), /Unknown provider ID/);
});

test('loadCustomProvider and validateProviderFile with default export class', async (t) => {
  const dir = await makeTestDir(t, 'provider');
  const file = path.join(dir, 'custom-provider.mjs');
  const content = `export default class CustomProvider {\n  constructor() { this.id = 'custom'; }\n  async init() {}\n  async handle() {}\n  async finish() {}\n}`;
  await fs.writeFile(file, content, 'utf8');

  const prov = await loadCustomProvider(file);
  assert.equal(prov.id, 'custom');
  await validateProviderFile(file);
});
