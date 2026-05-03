const prisma = require('../config/database');

class CategoryService {
  async create(businessId, data) {
    return prisma.category.create({
      data: {
        businessId,
        name: data.name,
        type: data.type,
        description: data.description || null
      }
    });
  }

  async getAll(businessId, filters = {}) {
    const where = { businessId };
    if (filters.type) where.type = filters.type;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { transactions: true } }
      }
    });
  }

  async getById(businessId, id) {
    return prisma.category.findFirst({
      where: { id, businessId }
    });
  }

  async update(businessId, id, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.category.update({
      where: { id, businessId },
      data: updateData
    });
  }

  async delete(businessId, id) {
    return prisma.category.delete({
      where: { id, businessId }
    });
  }

  async toggleStatus(businessId, id) {
    const category = await prisma.category.findFirst({ where: { id, businessId } });
    return prisma.category.update({
      where: { id, businessId },
      data: { isActive: !category.isActive }
    });
  }
}

module.exports = new CategoryService();
