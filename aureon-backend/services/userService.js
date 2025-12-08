import { User, Tenant, AuditLog } from '../models/index.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import logger from '../utils/logger.js';

class UserService {
  /**
   * Create new user
   */
  async createUser(userData, currentUser) {
    try {
      // Check if username or email already exists
      const existingUser = await User.findOne({
        where: {
          $or: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // Use current user's tenant_id if not specified
      const tenant_id = userData.tenant_id || currentUser.tenant_id;

      // Create user
      const user = await User.create({
        username: userData.username,
        password: userData.password, // Will be hashed by beforeCreate hook
        email: userData.email,
        role: userData.role,
        tenant_id,
        active: true,
        settings: userData.settings || {}
      });

      // Create audit log
      await AuditLog.create({
        user_id: currentUser.id,
        action: 'CREATE_USER',
        resource_type: 'user',
        resource_id: user.id,
        details: {
          username: user.username,
          role: user.role,
          email: user.email
        }
      });

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * List users with filters and pagination
   */
  async listUsers(filters = {}, pagination = { page: 1, limit: 50 }) {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const where = {};
      if (filters.role) where.role = filters.role;
      if (filters.active !== undefined) where.active = filters.active;
      if (filters.tenant_id) where.tenant_id = filters.tenant_id;

      const { rows: users, count } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'slug']
          }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        users,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          limit
        }
      };
    } catch (error) {
      logger.error('Error listing users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['id', 'name', 'slug']
          }
        ]
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updates, currentUser) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Track changes for audit
      const changes = {};
      if (updates.email && updates.email !== user.email) changes.email = { from: user.email, to: updates.email };
      if (updates.role && updates.role !== user.role) changes.role = { from: user.role, to: updates.role };
      if (updates.active !== undefined && updates.active !== user.active) changes.active = { from: user.active, to: updates.active };

      // Update user
      await user.update({
        email: updates.email || user.email,
        role: updates.role || user.role,
        active: updates.active !== undefined ? updates.active : user.active,
        settings: updates.settings ? { ...user.settings, ...updates.settings } : user.settings
      });

      // Create audit log
      await AuditLog.create({
        user_id: currentUser.id,
        action: 'UPDATE_USER',
        resource_type: 'user',
        resource_id: user.id,
        details: {
          changes,
          username: user.username
        }
      });

      // Return user without password
      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId, currentUser) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (user.id === currentUser.id) {
        throw new Error('Cannot deactivate your own account');
      }

      await user.update({ active: false });

      // Create audit log
      await AuditLog.create({
        user_id: currentUser.id,
        action: 'DEACTIVATE_USER',
        resource_type: 'user',
        resource_id: user.id,
        details: {
          username: user.username,
          role: user.role
        }
      });

      return user;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(userId, newPassword, currentUser) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      // Create audit log
      await AuditLog.create({
        user_id: currentUser.id,
        action: 'RESET_PASSWORD',
        resource_type: 'user',
        resource_id: user.id,
        details: {
          username: user.username,
          resetBy: currentUser.username,
          isSelfReset: currentUser.id === userId
        }
      });

      return user;
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Invite user (generate token)
   */
  async inviteUser(email, role, currentUser) {
    try {
      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Generate invite token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store invite in settings (temporary solution, ideally use separate table)
      const invite = {
        token,
        email,
        role,
        tenant_id: currentUser.tenant_id,
        invited_by: currentUser.id,
        expires_at: expiresAt,
        created_at: new Date()
      };

      // TODO: Send email with invite link
      // await emailService.sendInvite(email, token);

      logger.info('User invite created', { email, role, token });

      return { token, expiresAt };
    } catch (error) {
      logger.error('Error inviting user:', error);
      throw error;
    }
  }

  /**
   * Accept invite and create user
   */
  async acceptInvite(token, username, password) {
    try {
      // TODO: Validate token from invite table
      // For now, this is a placeholder implementation

      throw new Error('Invite system not fully implemented. Use direct user creation.');
    } catch (error) {
      logger.error('Error accepting invite:', error);
      throw error;
    }
  }
}

export default new UserService();
