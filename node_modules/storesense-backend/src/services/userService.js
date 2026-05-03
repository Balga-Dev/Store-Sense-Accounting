const prisma = require('../config/database');
const { hashPassword } = require('../utils/helpers');

class UserService {
  async create(businessId, data) {
    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        businessId,
        username: data.username,
        password: hashedPassword,
        email: data.email || null,
        fullName: data.fullName || null,
        roleId: data.roleId,
        mustResetPassword: data.mustResetPassword !== false
      },
      include: {
        role: true
      }
    });

    return user;
  }

  async getAll(businessId, filters = {}) {
    const where = { businessId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.roleId) where.roleId = filters.roleId;
    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { fullName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        role: true
      }
    });
  }

  async getById(businessId, id) {
    return prisma.user.findFirst({
      where: { id, businessId },
      include: {
        role: {
          include: {
            tabPermissions: { include: { permission: true } },
            actionPermissions: { include: { permission: true } }
          }
        },
        tabOverrides: { include: { permission: true } },
        actionOverrides: { include: { permission: true } }
      }
    });
  }

  async update(businessId, id, data) {
    const updateData = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.mustResetPassword !== undefined) updateData.mustResetPassword = data.mustResetPassword;

    return prisma.user.update({
      where: { id, businessId },
      data: updateData,
      include: { role: true }
    });
  }

  async resetPassword(businessId, id, newPassword) {
    const hashedPassword = await hashPassword(newPassword);
    return prisma.user.update({
      where: { id, businessId },
      data: {
        password: hashedPassword,
        mustResetPassword: true
      }
    });
  }

  async deleteUser(businessId, id) {
    return prisma.user.delete({
      where: { id, businessId }
    });
  }

  async toggleStatus(businessId, id) {
    const user = await prisma.user.findFirst({ where: { id, businessId } });
    return prisma.user.update({
      where: { id, businessId },
      data: { isActive: !user.isActive }
    });
  }

  async setTabOverride(businessId, userId, permissionId, isEnabled) {
    return prisma.userTabPermissionOverride.upsert({
      where: {
        userId_permissionId: { userId, permissionId }
      },
      update: { isEnabled },
      create: { userId, permissionId, isEnabled }
    });
  }

  async setActionOverride(businessId, userId, permissionId, isEnabled) {
    return prisma.userActionPermissionOverride.upsert({
      where: {
        userId_permissionId: { userId, permissionId }
      },
      update: { isEnabled },
      create: { userId, permissionId, isEnabled }
    });
  }

  async clearTabOverride(businessId, userId, permissionId) {
    return prisma.userTabPermissionOverride.deleteMany({
      where: { userId, permissionId }
    });
  }

  async clearActionOverride(businessId, userId, permissionId) {
    return prisma.userActionPermissionOverride.deleteMany({
      where: { userId, permissionId }
    });
  }

  async getEffectivePermissions(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            tabPermissions: { include: { permission: true } },
            actionPermissions: { include: { permission: true } }
          }
        },
        tabOverrides: { include: { permission: true } },
        actionOverrides: { include: { permission: true } }
      }
    });

    const effectiveTabs = {};
    const effectiveActions = {};

    user.role.tabPermissions.forEach(tp => {
      effectiveTabs[tp.permission.key] = tp.isEnabled;
    });

    user.tabOverrides.forEach(override => {
      effectiveTabs[override.permission.key] = override.isEnabled;
    });

    user.role.actionPermissions.forEach(ap => {
      effectiveActions[ap.permission.key] = ap.isEnabled;
    });

    user.actionOverrides.forEach(override => {
      effectiveActions[override.permission.key] = override.isEnabled;
    });

    return { tabs: effectiveTabs, actions: effectiveActions };
  }
}

module.exports = new UserService();
