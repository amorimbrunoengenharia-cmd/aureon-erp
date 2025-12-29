import express from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import emailService from '../services/emailService.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // ✅ Trim username to match validation on user creation
    username = username.trim();

    // ✅ DEBUG: Log login attempt
    logger.info('Login attempt:', { username, hasPassword: !!password });

    // ✅ Find user by username OR email (case-insensitive)
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username: username },
          { email: username }
        ],
        active: true 
      } 
    });

    // ✅ DEBUG: Log user found
    if (!user) {
      logger.warn('User not found:', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info('User found:', { id: user.id, username: user.username });

    // Check password
    const isValidPassword = await user.comparePassword(password);
    
    // ✅ DEBUG: Log password validation
    logger.info('Password validation:', { username: user.username, isValid: isValidPassword });
    
    if (!isValidPassword) {
      logger.warn('Invalid password for user:', { username: user.username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate tokens
    const accessToken = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role,
        tenant_id: user.tenant_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    logger.info(`User ${username} logged in successfully`);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        settings: user.settings
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout (cliente deve descartar tokens)
 */
router.post('/logout', authenticate, async (req, res) => {
  logger.info(`User ${req.user.username} logged out`);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * POST /api/auth/register
 * Registrar novo usuário (apenas CEO)
 */
router.post('/register', authenticate, authorize('CEO'), async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by the model hook
      role: role || 'USER',
      active: true
    });

    logger.info(`New user created: ${username} by ${req.user.username}`);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
      logger.info(`Welcome email sent to ${email}`);
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
