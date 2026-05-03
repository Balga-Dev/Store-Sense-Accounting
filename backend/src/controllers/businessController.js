const businessService = require('../services/businessService');

const create = async (req, res) => {
  try {
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const business = await businessService.create({ name, type, description });
    res.status(201).json(business);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const businesses = await businessService.getAll(filters);
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const business = await businessService.getById(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const business = await businessService.update(req.params.id, req.body);
    res.json(business);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const business = await businessService.toggleStatus(req.params.id);
    res.json(business);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteBusiness = async (req, res) => {
  try {
    await businessService.delete(req.params.id);
    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await businessService.getStats();
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
  toggleStatus,
  delete: deleteBusiness,
  getStats
};
