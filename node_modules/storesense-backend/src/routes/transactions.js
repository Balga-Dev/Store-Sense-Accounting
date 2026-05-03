const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authMiddleware, enforceBusinessScope } = require('../middleware/auth');
const { activityLogger } = require('../middleware/validation');

router.use(authMiddleware);
router.use(enforceBusinessScope);

router.post('/', activityLogger('TRANSACTION'), transactionController.create);
router.get('/', transactionController.getAll);
router.get('/summary', transactionController.getSummary);
router.get('/date-range', transactionController.getByDateRange);
router.get('/:id', transactionController.getById);
router.put('/:id', activityLogger('TRANSACTION'), transactionController.update);
router.delete('/:id', activityLogger('TRANSACTION'), transactionController.delete);

module.exports = router;
