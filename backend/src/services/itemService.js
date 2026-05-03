const prisma = require('../config/database');
const { generateItemCode } = require('../utils/helpers');

class ItemService {
  async create(businessId, createdById, data) {
    const itemCode = data.itemCode || generateItemCode();

    const item = await prisma.item.create({
      data: {
        businessId,
        itemCode,
        name: data.name,
        price: data.price,
        cost: data.cost || null,
        category: data.category || null,
        description: data.description || null,
        createdById
      }
    });

    return item;
  }

  async getAll(businessId, filters = {}) {
    const where = { businessId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { itemCode: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(businessId, id) {
    return prisma.item.findFirst({
      where: { id, businessId }
    });
  }

  async getByCode(businessId, itemCode) {
    return prisma.item.findFirst({
      where: { businessId, itemCode }
    });
  }

  async update(businessId, id, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.item.update({
      where: { id, businessId },
      data: updateData
    });
  }

  async delete(businessId, id) {
    return prisma.item.delete({
      where: { id, businessId }
    });
  }

  async toggleStatus(businessId, id) {
    const item = await prisma.item.findFirst({ where: { id, businessId } });
    return prisma.item.update({
      where: { id, businessId },
      data: { isActive: !item.isActive }
    });
  }

  async getCategories(businessId) {
    const items = await prisma.item.findMany({
      where: { businessId, category: { not: null } },
      select: { category: true },
      distinct: ['category']
    });

    return items.map(i => i.category).filter(Boolean);
  }

  async getStats(businessId) {
    const total = await prisma.item.count({ where: { businessId } });
    const active = await prisma.item.count({ where: { businessId, isActive: true } });

    return { total, active, inactive: total - active };
  }
}

module.exports = new ItemService();
