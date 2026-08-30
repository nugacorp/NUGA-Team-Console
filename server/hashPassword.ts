import { createPasswordHash } from './auth';

const chunks: Buffer[] = [];

for await (const chunk of process.stdin) {
  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
}

const password = Buffer.concat(chunks)
  .toString('utf8')
  .replace(/[\r\n]+$/, '');

if (!password) {
  console.error('No se recibió una contraseña por stdin.');
  process.exitCode = 1;
} else {
  console.log(createPasswordHash(password));
}
