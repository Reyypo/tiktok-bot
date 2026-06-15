const http = require('http');

function startHealthServer() {
  const port = Number(process.env.PORT) || 3000;

  const server = http.createServer((req, res) => {
    if (req.url !== '/' && req.url !== '/health') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'not_found' }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'rest-area-bot',
      uptime: Math.floor(process.uptime())
    }));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Health server aktif di port ${port}`);
  });

  server.on('error', error => {
    console.error('Health server gagal:', error);
  });

  return server;
}

module.exports = { startHealthServer };
