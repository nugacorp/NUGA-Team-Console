/* global console, process */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const forbidden = [
  'EDGE-DEMO-01',
  'Video Generado (Simulado)',
  '142/142',
  '92.4%',
  'ONLINE (SIMULADO)',
  'telemetría mock',
  'SIMULACIÓN SANDBOX DRY-RUN'
];

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  }));
  return nested.flat();
}

const artifactFiles = (await files(dist)).filter(file => /\.(?:js|html)$/.test(file));
const violations = [];

for (const file of artifactFiles) {
  const content = await readFile(file, 'utf8');
  for (const token of forbidden) {
    if (content.includes(token)) violations.push(`${path.relative(dist, file)}: ${token}`);
  }
}

if (violations.length) {
  console.error('production_artifact=FAIL');
  for (const violation of violations) console.error(violation);
  process.exit(1);
}

console.log(`production_artifact=PASS files=${artifactFiles.length} forbidden_tokens=${forbidden.length}`);
