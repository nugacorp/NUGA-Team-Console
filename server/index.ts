import express from 'express';
import { createApp } from './app';
import { loadServerConfig } from './config';
import { createMikrotikControlPlaneRouter } from './mikrotikControlPlaneRouter';

const config = loadServerConfig();
const coreApp = createApp(config);
const app = express();

app.use('/api/v1/wisp', createMikrotikControlPlaneRouter(config));
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
