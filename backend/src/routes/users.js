const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, enforceBusinessScope } = require('../middleware/auth');

router.use(authMiddleware);
router.use(enforceBusinessScope);

router.post('/', userController.create);
router.get('/', userController.getAll);
router.get('/permissions/:userId', userController.getEffectivePermissions);
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.patch('/:id/toggle-status', userController.toggleStatus);
router.post('/:id/reset-password', userController.resetPassword);
router.delete('/:id', userController.delete);

router.put('/:userId/tab-override', userController.setTabOverride);
router.put('/:userId/action-override', userController.setActionOverride);
router.delete('/:userId/tab-override/:permissionId', userController.clearTabOverride);
router.delete('/:userId/action-override/:permissionId', userController.clearActionOverride);

module.exports = router;
