const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { superAdminAuth } = require('../middleware/auth');

router.use(superAdminAuth);

router.post('/', businessController.create);
router.get('/', businessController.getAll);
router.get('/stats', businessController.getStats);
router.get('/:id', businessController.getById);
router.put('/:id', businessController.update);
router.patch('/:id/toggle-status', businessController.toggleStatus);
router.delete('/:id', businessController.delete);

module.exports = router;
