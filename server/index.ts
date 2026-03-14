/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const next = require('next');
const { initSocketServer } = require('./socket');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req: any, res: any) => {
    handle(req, res);
  });

  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`\n🃏 Poker Game running at http://${hostname}:${port}`);
    console.log(`   Environment: ${dev ? 'development' : 'production'}\n`);
  });
});
