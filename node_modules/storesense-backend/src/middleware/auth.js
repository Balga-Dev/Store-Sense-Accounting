const jwt = require('jsonwebtoken');
const config = require('../config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            tabPermissions: { include: { permission: true } },
            actionPermissions: { include: { permission: true } }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    const business = await prisma.business.findUnique({
      where: { id: user.businessId }
    });

    if (!business || !business.isActive) {
      return res.status(401).json({ error: 'Business is inactive' });
    }

    req.user = user;
    req.business = business;
    req.userBusinessId = user.businessId;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const superAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: decoded.userId }
    });

    if (!superAdmin) {
      return res.status(401).json({ error: 'Invalid super admin' });
    }

    req.superAdmin = superAdmin;
    req.isSuperAdmin = true;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requirePermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const { user, userRole } = req;

      const actionPermission = userRole.actionPermissions.find(
        (p) => p.permission.key === permissionKey
      );

      if (actionPermission && !actionPermission.isEnabled) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const userOverride = await prisma.userActionPermissionOverride.findUnique({
        where: {
          userId_permissionId: {
            userId: user.id,
            permissionId: actionPermission?.permissionId || ''
          }
        }
      });

      if (userOverride && !userOverride.isEnabled) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

const requireTabAccess = (tabKey) => {
  return async (req, res, next) => {
    try {
      const { user, userRole } = req;

      const tabPermission = userRole.tabPermissions.find(
        (p) => p.permission.key === tabKey
      );

      if (tabPermission && !tabPermission.isEnabled) {
        return res.status(403).json({ error: 'Tab access denied' });
      }

      const userOverride = await prisma.userTabPermissionOverride.findUnique({
        where: {
          userId_permissionId: {
            userId: user.id,
            permissionId: tabPermission?.permissionId || ''
          }
        }
      });

      if (userOverride && !userOverride.isEnabled) {
        return res.status(403).json({ error: 'Tab access denied' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Tab access check failed' });
    }
  };
};

const enforceBusinessScope = (req, res, next) => {
  if (req.isSuperAdmin) {
    return next();
  }

  if (req.params.businessId && req.params.businessId !== req.userBusinessId) {
    return res.status(403).json({ error: 'Cross-business access denied' });
  }

  if (req.body.businessId && req.body.businessId !== req.userBusinessId) {
    return res.status(403).json({ error: 'Cross-business access denied' });
  }

  req.scopedBusinessId = req.userBusinessId;
  next();
};

module.exports = {
  authMiddleware,
  superAdminAuth,
  requirePermission,
  requireTabAccess,
  enforceBusinessScope
};
