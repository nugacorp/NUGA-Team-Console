import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('../dist/assets/', import.meta.url));
const limitBytes = 500 * 1024;

const files = await readdir(root);
const javascript = files.filter(file => file.endsWith('.js'));
const oversized = [];

for (const file of javascript) {
  const path = join(root, file);
  const size = (await stat(path)).size;
  if (size > limitBytes) oversized.push({ file, size });
}

if (oversized.length) {
  for (const { file, size } of oversized) {
    process.stderr.write(`${relative(process.cwd(), join(root, file))}: ${(size / 1024).toFixed(2)} kB\n`);
  }
  process.stderr.write('Bundle limit exceeded: every JavaScript chunk must be <= 500 kB.\n');
  process.exit(1);
}

const largest = await Promise.all(javascript.map(async file => ({
  file,
  size: (await stat(join(root, file))).size
})));
largest.sort((a, b) => b.size - a.size);
process.stdout.write(`bundle_size=PASS largest=${largest[0]?.file ?? 'none'} ${(largest[0]?.size / 1024).toFixed(2)}kB\n`);
