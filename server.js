const { createServer } = require('http');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: dev 
        ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
        : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store io globally for use in API routes
  global.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle user authentication and room joining
    socket.on('authenticate', (userData) => {
      socket.data.user = userData;
      
      // Join role-based rooms
      socket.join(`role:${userData.role}`);
      socket.join(`user:${userData.userId}`);
      
      console.log(`User ${userData.email} (${userData.role}) authenticated and joined rooms`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server initialized`);
    });
}); 