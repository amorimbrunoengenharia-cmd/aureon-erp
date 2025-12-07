import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      tenant_id: decoded.tenant_id // ← CRÍTICO: Incluir tenant_id do JWT
    };

    logger.debug('✅ User authenticated', {
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      tenant_id: req.user.tenant_id
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Garantir que roles é um array
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    // Normalizar roles para lowercase para comparação case-insensitive
    const normalizedRoles = roleArray.map(r => String(r).toLowerCase());
    const userRole = String(req.user.role).toLowerCase();

    // ✅ Aceitar 'admin' ou 'gerente' como CEO
    const roleMap = {
      'admin': 'ceo',
      'gerente': 'gerente'
    };
    const mappedRole = roleMap[userRole] || userRole;

    if (!normalizedRoles.includes(mappedRole)) {
      logger.warn('⛔ Authorization failed', {
        userRole: req.user.role,
        requiredRoles: roles,
        userId: req.user.id
      });
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }

    next();
  };
};
