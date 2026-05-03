const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authMiddleware, enforceBusinessScope } = require('../middleware/auth');

router.use(authMiddleware);
router.use(enforceBusinessScope);

router.post('/', roleController.create);
router.get('/', roleController.getAll);
router.get('/permissions', roleController.getDefaultPermissions);
router.get('/:id', roleController.getById);
router.put('/:id', roleController.update);
router.put('/:id/tab-permissions', roleController.setTabPermissions);
router.put('/:id/action-permissions', roleController.setActionPermissions);
router.delete('/:id', roleController.delete);

module.exports = router;
