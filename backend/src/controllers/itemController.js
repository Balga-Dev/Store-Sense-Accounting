const itemService = require('../services/itemService');

const create = async (req, res) => {
  try {
    const { itemCode, name, price, cost, category, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const item = await itemService.create(req.scopedBusinessId, req.user.id, {
      itemCode, name, price, cost, category, description
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { isActive, category, search } = req.query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (category) filters.category = category;
    if (search) filters.search = search;

    const items = await itemService.getAll(req.scopedBusinessId, filters);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const item = await itemService.getById(req.scopedBusinessId, req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const item = await itemService.update(req.scopedBusinessId, req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    await itemService.delete(req.scopedBusinessId, req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const item = await itemService.toggleStatus(req.scopedBusinessId, req.params.id);
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await itemService.getCategories(req.scopedBusinessId);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await itemService.getStats(req.scopedBusinessId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteItem,
  toggleStatus,
  getCategories,
  getStats
};
