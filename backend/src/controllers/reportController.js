const categoryService = require('../services/categoryService');
const reportService = require('../services/reportService');
const prisma = require('../config/database');

const createCategory = async (req, res) => {
  try {
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const category = await categoryService.create(req.scopedBusinessId, { name, type, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { type, isActive, search } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const categories = await categoryService.getAll(req.scopedBusinessId, filters);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.update(req.scopedBusinessId, req.params.id, req.body);
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await categoryService.delete(req.scopedBusinessId, req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await categoryService.toggleStatus(req.scopedBusinessId, req.params.id);
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getDailyLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const logs = await reportService.getDailyLogs(req.scopedBusinessId, startDate, endDate);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const summary = await reportService.getFinancialSummary(req.scopedBusinessId, startDate, endDate);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCategoryBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const breakdown = await reportService.getCategoryBreakdown(req.scopedBusinessId, startDate, endDate);
    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTrends = async (req, res) => {
  try {
    const { startDate, endDate, granularity } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const trends = await reportService.getTrends(
      req.scopedBusinessId, startDate, endDate, granularity || 'daily'
    );
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTopItems = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const items = await reportService.getTopItems(
      req.scopedBusinessId, startDate, endDate, parseInt(limit) || 10
    );
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportTransactions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const data = await reportService.exportTransactions(req.scopedBusinessId, startDate, endDate);

    const headers = ['ID', 'Date', 'Type', 'Amount', 'Category', 'Description', 'Reference', 'Created By'];
    const csvRows = [headers.join(',')];

    data.forEach(t => {
      csvRows.push([
        t.id, t.date, t.type, t.amount, t.category,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.reference || '', t.createdBy
      ].join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${startDate}_${endDate}.csv`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const todayStr = today.toISOString().split('T')[0];
    const weekStartStr = startOfWeek.toISOString().split('T')[0];
    const monthStartStr = startOfMonth.toISOString().split('T')[0];

    const [todaySummary, weekSummary, monthSummary, recentTransactions, itemStats, userCount] = await Promise.all([
      reportService.getFinancialSummary(req.scopedBusinessId, todayStr, todayStr),
      reportService.getFinancialSummary(req.scopedBusinessId, weekStartStr, todayStr),
      reportService.getFinancialSummary(req.scopedBusinessId, monthStartStr, todayStr),
      prisma.transaction.findMany({
        where: { businessId: req.scopedBusinessId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { category: true, createdBy: { select: { username: true, fullName: true } } }
      }),
      prisma.item.count({ where: { businessId: req.scopedBusinessId, isActive: true } }),
      prisma.user.count({ where: { businessId: req.scopedBusinessId, isActive: true } })
    ]);

    res.json({
      today: todaySummary,
      week: weekSummary,
      month: monthSummary,
      recentTransactions,
      itemStats,
      userCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const { limit, offset, action, entityType } = req.query;
    const where = { businessId: req.scopedBusinessId };
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit) || 50,
      skip: parseInt(offset) || 0,
      include: {
        user: { select: { username: true, fullName: true } }
      }
    });

    const total = await prisma.activityLog.count({ where });

    res.json({ logs, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { isRead } = req.query;
    const where = { businessId: req.scopedBusinessId };
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        id: req.params.id,
        businessId: req.scopedBusinessId
      },
      data: { isRead: true }
    });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getDailyLogs,
  getFinancialSummary,
  getCategoryBreakdown,
  getTrends,
  getTopItems,
  exportTransactions,
  getDashboard,
  getActivityLogs,
  getNotifications,
  markNotificationRead
};
