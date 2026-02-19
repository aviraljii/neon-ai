const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Use Next.js built-in server
  const { createServer } = require('http');
  
  const server = createServer((req, res) => {
    handle(req, res);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://localhost:${port}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
