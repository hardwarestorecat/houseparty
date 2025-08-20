import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import logger from './utils/logger';

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Connect to MongoDB
mongoose
  .connect(config.mongodb.uri)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error(`MongoDB connection error: ${err}`);
    process.exit(1);
  });

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Get user ID from auth data
  const userId = socket.handshake.auth.userId;
  
  if (!userId) {
    logger.warn(`Socket ${socket.id} has no user ID`);
    socket.disconnect();
    return;
  }

  // Join user's room
  socket.join(`user:${userId}`);

  // Handle enter house event
  socket.on('enter_house', (userId) => {
    // Add user to house room
    socket.join('house');
    
    // Notify all users in house
    socket.to('house').emit('user_entered', { userId });
    
    logger.info(`User ${userId} entered the house`);
  });

  // Handle leave house event
  socket.on('leave_house', (userId) => {
    // Remove user from house room
    socket.leave('house');
    
    // Notify all users in house
    socket.to('house').emit('user_left', { userId });
    
    logger.info(`User ${userId} left the house`);
  });

  // Handle get users in house
  socket.on('get_users_in_house', (callback) => {
    // Get all sockets in house room
    const sockets = io.sockets.adapter.rooms.get('house');
    
    if (!sockets) {
      callback([]);
      return;
    }
    
    // Get user IDs from sockets
    const userIds = Array.from(sockets).map((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      return socket?.handshake.auth.userId;
    }).filter(Boolean);
    
    callback(userIds);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
    
    // Notify all users in house
    socket.to('house').emit('user_left', { userId });
  });
});

// Start server
const PORT = config.server.port;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

