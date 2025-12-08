/**
 * WebSocket Service for Real-Time Updates
 * Gerencia conexões Socket.IO e broadcasts de eventos
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.tenantRooms = new Map(); // tenantId -> Set of socket IDs
  }

  /**
   * Inicializa Socket.IO com servidor HTTP
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Middleware de autenticação
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verificar token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.tenantId = decoded.tenant_id;
        socket.userRole = decoded.role;
        socket.username = decoded.username;

        logger.info('WebSocket client authenticated', {
          userId: socket.userId,
          tenantId: socket.tenantId,
          socketId: socket.id
        });

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Invalid token'));
      }
    });

    // Event handlers
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('✅ WebSocket service initialized');
  }

  /**
   * Manipula nova conexão
   */
  handleConnection(socket) {
    const { userId, tenantId, username } = socket;

    // Adicionar ao mapa de usuários
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socket.id);

    // Juntar à room do tenant
    socket.join(`tenant:${tenantId}`);
    if (!this.tenantRooms.has(tenantId)) {
      this.tenantRooms.set(tenantId, new Set());
    }
    this.tenantRooms.get(tenantId).add(socket.id);

    // Juntar à room do usuário (para notificações pessoais)
    socket.join(`user:${userId}`);

    logger.info(`User ${username} connected via WebSocket`, {
      socketId: socket.id,
      userId,
      tenantId
    });

    // Enviar confirmação de conexão
    socket.emit('connected', {
      message: 'Connected to AUREON real-time updates',
      userId,
      tenantId,
      timestamp: new Date().toISOString()
    });

    // Event: Ping/Pong para manter conexão
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Event: Subscrever a canais específicos
    socket.on('subscribe', (channels) => {
      if (Array.isArray(channels)) {
        channels.forEach(channel => {
          socket.join(channel);
          logger.info(`User ${username} subscribed to ${channel}`);
        });
        socket.emit('subscribed', { channels });
      }
    });

    // Event: Desinscrever de canais
    socket.on('unsubscribe', (channels) => {
      if (Array.isArray(channels)) {
        channels.forEach(channel => {
          socket.leave(channel);
          logger.info(`User ${username} unsubscribed from ${channel}`);
        });
        socket.emit('unsubscribed', { channels });
      }
    });

    // Desconexão
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
  }

  /**
   * Manipula desconexão
   */
  handleDisconnection(socket, reason) {
    const { userId, tenantId, username } = socket;

    // Remover do mapa de usuários
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socket.id);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // Remover da room do tenant
    if (this.tenantRooms.has(tenantId)) {
      this.tenantRooms.get(tenantId).delete(socket.id);
      if (this.tenantRooms.get(tenantId).size === 0) {
        this.tenantRooms.delete(tenantId);
      }
    }

    logger.info(`User ${username} disconnected`, {
      socketId: socket.id,
      reason,
      userId,
      tenantId
    });
  }

  /**
   * Broadcast para todos os usuários de um tenant
   */
  broadcastToTenant(tenantId, event, data) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.to(`tenant:${tenantId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Broadcast to tenant ${tenantId}:`, { event, data });
  }

  /**
   * Enviar para usuário específico
   */
  sendToUser(userId, event, data) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Sent to user ${userId}:`, { event, data });
  }

  /**
   * Broadcast para canal específico
   */
  broadcastToChannel(channel, event, data) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.to(channel).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Broadcast to channel ${channel}:`, { event, data });
  }

  /**
   * Broadcast para todos conectados
   */
  broadcastToAll(event, data) {
    if (!this.io) {
      logger.warn('WebSocket not initialized');
      return;
    }

    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug('Broadcast to all:', { event, data });
  }

  /**
   * Retorna estatísticas de conexões
   */
  getStats() {
    return {
      totalConnections: this.io ? this.io.engine.clientsCount : 0,
      connectedUsers: this.userSockets.size,
      connectedTenants: this.tenantRooms.size,
      userSockets: Array.from(this.userSockets.entries()).map(([userId, sockets]) => ({
        userId,
        socketCount: sockets.size
      })),
      tenantRooms: Array.from(this.tenantRooms.entries()).map(([tenantId, sockets]) => ({
        tenantId,
        socketCount: sockets.size
      }))
    };
  }

  /**
   * Desconecta usuário específico
   */
  disconnectUser(userId, reason = 'Server disconnect') {
    if (this.userSockets.has(userId)) {
      const socketIds = Array.from(this.userSockets.get(userId));
      socketIds.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
          logger.info(`Forcefully disconnected user ${userId}`, { socketId, reason });
        }
      });
    }
  }

  /**
   * Helpers para eventos comuns
   */
  notifyNewSale(tenantId, saleData) {
    this.broadcastToTenant(tenantId, 'sale:created', saleData);
  }

  notifyProductUpdate(tenantId, productData) {
    this.broadcastToTenant(tenantId, 'product:updated', productData);
  }

  notifyStockAlert(tenantId, alertData) {
    this.broadcastToTenant(tenantId, 'stock:alert', alertData);
  }

  notifyUserAction(userId, action, data) {
    this.sendToUser(userId, 'user:action', { action, ...data });
  }

  notifySystemAlert(message, severity = 'info') {
    this.broadcastToAll('system:alert', { message, severity });
  }
}

// Singleton
const wsService = new WebSocketService();

export default wsService;
