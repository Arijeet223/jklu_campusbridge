const http = require('http');

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
    clientRes.end('Proxy error connecting to Next.js on port 3000: ' + err.message);
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.listen(3001, '0.0.0.0', () => {
  console.log('Reverse proxy listening on http://0.0.0.0:3001 -> forwarding to http://localhost:3000');
});

