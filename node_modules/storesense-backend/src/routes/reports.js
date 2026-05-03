const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware, enforceBusinessScope } = require('../middleware/auth');

router.use(authMiddleware);
router.use(enforceBusinessScope);

router.get('/dashboard', reportController.getDashboard);
router.get('/categories', reportController.getAllCategories);
router.post('/categories', reportController.createCategory);
router.put('/categories/:id', reportController.updateCategory);
router.patch('/categories/:id/toggle-status', reportController.toggleCategoryStatus);
router.delete('/categories/:id', reportController.deleteCategory);
router.get('/daily-logs', reportController.getDailyLogs);
router.get('/financial-summary', reportController.getFinancialSummary);
router.get('/category-breakdown', reportController.getCategoryBreakdown);
router.get('/trends', reportController.getTrends);
router.get('/top-items', reportController.getTopItems);
router.get('/export', reportController.exportTransactions);
router.get('/activity-logs', reportController.getActivityLogs);
router.get('/notifications', reportController.getNotifications);
router.patch('/notifications/:id/read', reportController.markNotificationRead);

module.exports = router;
