import { createServer } from 'node:http';

function getPort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`Nieprawidłowa wartość PORT: ${value}`);
  }
  return port;
}

export function startHealthServer(client, options = {}) {
  const port = getPort(options.port ?? process.env.PORT ?? 3_000);
  const host = options.host ?? '0.0.0.0';
  const logger = options.logger ?? console.log;

  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;

    if (request.method !== 'GET') {
      response.writeHead(405, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    if (path !== '/' && path !== '/health') {
      response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Not Found' }));
      return;
    }

    response.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(
      JSON.stringify({
        service: 'EMUPLCOOM Bot',
        status: client.isReady() ? 'online' : 'starting',
        uptimeSeconds: Math.floor(process.uptime()),
      }),
    );
  });

  server.on('error', (error) => {
    console.error('Błąd serwera kontrolnego:', error);
  });

  server.listen(port, host, () => {
    const address = server.address();
    const activePort = typeof address === 'object' && address ? address.port : port;
    logger(`Serwer kontrolny działa na porcie ${activePort} (/health).`);
  });

  return server;
}
