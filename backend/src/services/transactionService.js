const prisma = require('../config/database');

class TransactionService {
  async create(businessId, createdById, data) {
    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          businessId,
          type: data.type,
          amount: data.amount,
          categoryId: data.categoryId || null,
          description: data.description || null,
          reference: data.reference || null,
          date: data.date ? new Date(data.date) : new Date(),
          createdById
        }
      });

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await tx.itemTransaction.create({
            data: {
              transactionId: newTransaction.id,
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total
            }
          });
        }
      }

      return newTransaction;
    });

    await this.updateDailyLog(businessId, transaction.date);

    return transaction;
  }

  async getAll(businessId, filters = {}) {
    const where = { businessId };
    if (filters.type) where.type = filters.type;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { reference: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        category: true,
        createdBy: { select: { username: true, fullName: true } },
        items: { include: { item: true } }
      },
      skip: filters.offset || 0,
      take: filters.limit || 50
    });
  }

  async getById(businessId, id) {
    return prisma.transaction.findFirst({
      where: { id, businessId },
      include: {
        category: true,
        createdBy: { select: { username: true, fullName: true } },
        items: { include: { item: true } }
      }
    });
  }

  async update(businessId, id, data) {
    const updateData = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.date !== undefined) updateData.date = new Date(data.date);

    const transaction = await prisma.transaction.update({
      where: { id, businessId },
      data: updateData
    });

    await this.updateDailyLog(businessId, transaction.date);

    return transaction;
  }

  async delete(businessId, id) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, businessId }
    });

    await prisma.itemTransaction.deleteMany({
      where: { transactionId: id }
    });

    await prisma.transaction.delete({
      where: { id, businessId }
    });

    if (transaction) {
      await this.updateDailyLog(businessId, transaction.date);
    }
  }

  async updateDailyLog(businessId, date) {
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    const startOfDay = new Date(logDate);
    const endOfDay = new Date(logDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'INCOME') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    });

    await prisma.dailyLog.upsert({
      where: {
        businessId_date: {
          businessId,
          date: logDate
        }
      },
      update: {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        transactionCount: transactions.length
      },
      create: {
        businessId,
        date: logDate,
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        transactionCount: transactions.length
      }
    });
  }

  async getSummary(businessId, startDate, endDate) {
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.type === 'INCOME') totalIncome += amount;
      else totalExpenses += amount;
    });

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: transactions.length
    };
  }

  async getByDateRange(businessId, startDate, endDate) {
    return prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { date: 'asc' },
      include: {
        category: true,
        createdBy: { select: { username: true, fullName: true } }
      }
    });
  }
}

module.exports = new TransactionService();
