import express from 'express';
import { createApp } from './app';
import { loadServerConfig } from './config';
import { MikroMcpReadOnlyAdapter } from './mikroMcpReadOnlyAdapter';
import { createMikrotikControlPlaneRouter } from './mikrotikControlPlaneRouter';

const config = loadServerConfig();
const mikroMcpAdapter = config.mikroMcpReadOnlyEnabled === true
  ? new MikroMcpReadOnlyAdapter({
      endpoint: config.mikroMcpUrl ?? 'http://127.0.0.1:3000/mcp',
      token: config.mikroMcpToken ?? '',
      timeoutMs: 8_000,
      maxResponseBytes: 1_048_576
    })
  : null;
const coreApp = createApp(config, { mikroMcpAdapter: mikroMcpAdapter ?? undefined });
const app = express();
app.disable('x-powered-by');

app.use('/api/v1/wisp', createMikrotikControlPlaneRouter(config, { mikroMcpAdapter }));
app.use(coreApp);

const server = app.listen(config.port, config.host, () => {
  console.log(
    `NUGA Console API escuchando en http://${config.host}:${config.port} (${config.mode})`
  );
});

function shutdown(signal: string) {
  console.log(`NUGA Console API recibió ${signal}; cerrando.`);
  server.close(error => {
    if (error) {
      console.error('No fue posible cerrar el servidor limpiamente.');
      process.exitCode = 1;
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
