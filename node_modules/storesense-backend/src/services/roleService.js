const prisma = require('../config/database');

class RoleService {
  async create(businessId, data) {
    const role = await prisma.role.create({
      data: {
        businessId,
        name: data.name,
        description: data.description || null
      }
    });

    return role;
  }

  async getAll(businessId) {
    return prisma.role.findMany({
      where: {
        OR: [
          { businessId },
          { businessId: null, isDefault: true }
        ]
      },
      include: {
        tabPermissions: { include: { permission: true } },
        actionPermissions: { include: { permission: true } },
        _count: { select: { users: true } }
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    });
  }

  async getById(businessId, id) {
    return prisma.role.findFirst({
      where: {
        id,
        OR: [
          { businessId },
          { businessId: null }
        ]
      },
      include: {
        tabPermissions: { include: { permission: true } },
        actionPermissions: { include: { permission: true } }
      }
    });
  }

  async update(businessId, id, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    return prisma.role.update({
      where: { id },
      data: updateData
    });
  }

  async delete(businessId, id) {
    const role = await prisma.role.findFirst({
      where: { id, businessId }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isDefault) {
      throw new Error('Cannot delete default roles');
    }

    const userCount = await prisma.user.count({ where: { roleId: id } });
    if (userCount > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    return prisma.role.delete({ where: { id } });
  }

  async setTabPermissions(businessId, roleId, permissions) {
    await prisma.roleTabPermission.deleteMany({
      where: { roleId }
    });

    const created = await prisma.roleTabPermission.createMany({
      data: permissions.map(p => ({
        roleId,
        permissionId: p.permissionId,
        isEnabled: p.isEnabled
      }))
    });

    return created;
  }

  async setActionPermissions(businessId, roleId, permissions) {
    await prisma.roleActionPermission.deleteMany({
      where: { roleId }
    });

    const created = await prisma.roleActionPermission.createMany({
      data: permissions.map(p => ({
        roleId,
        permissionId: p.permissionId,
        isEnabled: p.isEnabled
      }))
    });

    return created;
  }

  async getDefaultPermissions() {
    const tabPermissions = await prisma.permission.findMany({
      where: { category: 'TAB' }
    });

    const actionPermissions = await prisma.permission.findMany({
      where: { category: 'ACTION' }
    });

    return { tabs: tabPermissions, actions: actionPermissions };
  }
}

module.exports = new RoleService();
