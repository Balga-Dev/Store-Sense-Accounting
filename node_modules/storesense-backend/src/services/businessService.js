const prisma = require('../config/database');
const { generateBusinessCode } = require('../utils/helpers');

class BusinessService {
  async create(data) {
    const businessCode = generateBusinessCode();

    const business = await prisma.business.create({
      data: {
        businessCode,
        name: data.name,
        type: data.type,
        description: data.description || null
      }
    });

    return business;
  }

  async getAll(filters = {}) {
    const where = {};
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { businessCode: { contains: filters.search, mode: 'insensitive' } },
        { type: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.business.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, items: true, transactions: true }
        }
      }
    });
  }

  async getById(id) {
    return prisma.business.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, items: true, transactions: true }
        }
      }
    });
  }

  async update(id, data) {
    return prisma.business.update({
      where: { id },
      data
    });
  }

  async toggleStatus(id) {
    const business = await prisma.business.findUnique({ where: { id } });
    return prisma.business.update({
      where: { id },
      data: { isActive: !business.isActive }
    });
  }

  async delete(id) {
    return prisma.business.delete({
      where: { id }
    });
  }

  async getStats() {
    const totalBusinesses = await prisma.business.count();
    const activeBusinesses = await prisma.business.count({ where: { isActive: true } });
    const totalUsers = await prisma.user.count();
    const totalTransactions = await prisma.transaction.count();

    return {
      totalBusinesses,
      activeBusinesses,
      inactiveBusinesses: totalBusinesses - activeBusinesses,
      totalUsers,
      totalTransactions
    };
  }
}

module.exports = new BusinessService();
