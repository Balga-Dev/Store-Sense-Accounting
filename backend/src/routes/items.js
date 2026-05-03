const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authMiddleware, enforceBusinessScope } = require('../middleware/auth');
const { activityLogger } = require('../middleware/validation');

router.use(authMiddleware);
router.use(enforceBusinessScope);

router.post('/', activityLogger('ITEM'), itemController.create);
router.get('/', itemController.getAll);
router.get('/categories', itemController.getCategories);
router.get('/stats', itemController.getStats);
router.get('/:id', itemController.getById);
router.put('/:id', activityLogger('ITEM'), itemController.update);
router.patch('/:id/toggle-status', activityLogger('ITEM'), itemController.toggleStatus);
router.delete('/:id', activityLogger('ITEM'), itemController.delete);

module.exports = router;
