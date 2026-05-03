const prisma = require('../config/database');
const { hashPassword, comparePassword, generateToken } = require('../utils/helpers');

class AuthService {
  async login(businessCode, username, password) {
    const business = await prisma.business.findUnique({
      where: { businessCode }
    });

    if (!business || !business.isActive) {
      throw new Error('Invalid business code or business is inactive');
    }

    const user = await prisma.user.findUnique({
      where: {
        businessId_username: {
          businessId: business.id,
          username
        }
      },
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
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({
      userId: user.id,
      businessId: business.id,
      businessCode: business.businessCode,
      username: user.username,
      role: user.role.roleType || 'CUSTOM'
    });

    await prisma.activityLog.create({
      data: {
        businessId: business.id,
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        details: JSON.stringify({ username })
      }
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        businessId: business.id,
        businessCode: business.businessCode,
        businessName: business.name,
        role: {
          id: user.role.id,
          name: user.role.name,
          roleType: user.role.roleType
        },
        mustResetPassword: user.mustResetPassword
      }
    };
  }

  async superAdminLogin(username, password) {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { username }
    });

    if (!superAdmin) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await comparePassword(password, superAdmin.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({
      userId: superAdmin.id,
      role: 'SUPER_ADMIN',
      username: superAdmin.username
    });

    return {
      token,
      user: {
        id: superAdmin.id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: 'SUPER_ADMIN'
      }
    };
  }

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            tabPermissions: { include: { permission: true } },
            actionPermissions: { include: { permission: true } }
          }
        },
        business: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      business: user.business,
      role: user.role
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustResetPassword: false
      }
    });

    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();
