import fs from 'node:fs/promises';
import path from 'node:path';

export const testRoot = path.resolve(process.cwd(), '.test-output');

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function rimraf(target) {
  try {
    await fs.rm(target, { recursive: true, force: true });
  } catch {}
}

export async function makeTestDir(t, prefix = 'tmp') {
  await ensureDir(testRoot);
  const dir = await fs.mkdtemp(path.join(testRoot, `${prefix}-`));
  if (t && typeof t.after === 'function') {
    t.after(async () => {
      await rimraf(dir);
    });
  }
  return dir;
}

export async function writeTestFile(dir, rel, content) {
  const full = path.join(dir, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf8');
}

