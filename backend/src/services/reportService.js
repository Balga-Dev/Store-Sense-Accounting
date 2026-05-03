const prisma = require('../config/database');

class ReportService {
  async getDailyLogs(businessId, startDate, endDate) {
    return prisma.dailyLog.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async getFinancialSummary(businessId, startDate, endDate) {
    const dailyLogs = await prisma.dailyLog.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    const totals = dailyLogs.reduce((acc, log) => ({
      totalIncome: acc.totalIncome + parseFloat(log.totalIncome),
      totalExpenses: acc.totalExpenses + parseFloat(log.totalExpenses),
      transactionCount: acc.transactionCount + log.transactionCount
    }), { totalIncome: 0, totalExpenses: 0, transactionCount: 0 });

    return {
      ...totals,
      netBalance: totals.totalIncome - totals.totalExpenses,
      averageDailyIncome: totals.totalIncome / (dailyLogs.length || 1),
      averageDailyExpenses: totals.totalExpenses / (dailyLogs.length || 1),
      period: { start: startDate, end: endDate, days: dailyLogs.length }
    };
  }

  async getCategoryBreakdown(businessId, startDate, endDate) {
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        categoryId: { not: null }
      },
      include: { category: true }
    });

    const breakdown = {};
    transactions.forEach(t => {
      const catName = t.category?.name || 'Uncategorized';
      if (!breakdown[catName]) {
        breakdown[catName] = { income: 0, expenses: 0, count: 0 };
      }
      const amount = parseFloat(t.amount);
      if (t.type === 'INCOME') {
        breakdown[catName].income += amount;
      } else {
        breakdown[catName].expenses += amount;
      }
      breakdown[catName].count += 1;
    });

    return Object.entries(breakdown).map(([name, data]) => ({
      name,
      ...data,
      net: data.income - data.expenses
    }));
  }

  async getTrends(businessId, startDate, endDate, granularity = 'daily') {
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { date: 'asc' }
    });

    const trends = {};
    transactions.forEach(t => {
      let key;
      const date = new Date(t.date);
      if (granularity === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (granularity === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trends[key]) {
        trends[key] = { income: 0, expenses: 0, count: 0 };
      }
      const amount = parseFloat(t.amount);
      if (t.type === 'INCOME') {
        trends[key].income += amount;
      } else {
        trends[key].expenses += amount;
      }
      trends[key].count += 1;
    });

    return Object.entries(trends)
      .map(([date, data]) => ({
        date,
        ...data,
        net: data.income - data.expenses
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopItems(businessId, startDate, endDate, limit = 10) {
    const items = await prisma.itemTransaction.findMany({
      where: {
        transaction: {
          businessId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      },
      include: { item: true },
      orderBy: { total: 'desc' }
    });

    const aggregated = {};
    items.forEach(it => {
      if (!aggregated[it.item.id]) {
        aggregated[it.item.id] = {
          itemId: it.item.id,
          name: it.item.name,
          itemCode: it.item.itemCode,
          totalQuantity: 0,
          totalRevenue: 0,
          transactions: 0
        };
      }
      aggregated[it.item.id].totalQuantity += it.quantity;
      aggregated[it.item.id].totalRevenue += parseFloat(it.total);
      aggregated[it.item.id].transactions += 1;
    });

    return Object.values(aggregated)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  async exportTransactions(businessId, startDate, endDate) {
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        category: true,
        createdBy: { select: { username: true, fullName: true } },
        items: { include: { item: true } }
      },
      orderBy: { date: 'asc' }
    });

    return transactions.map(t => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      type: t.type,
      amount: t.amount.toString(),
      category: t.category?.name || '',
      description: t.description || '',
      reference: t.reference || '',
      createdBy: t.createdBy.fullName || t.createdBy.username,
      items: t.items.map(it => ({
        itemCode: it.item.itemCode,
        name: it.item.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toString(),
        total: it.total.toString()
      }))
    }));
  }
}

module.exports = new ReportService();
