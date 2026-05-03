const transactionService = require('../services/transactionService');

const create = async (req, res) => {
  try {
    const { type, amount, categoryId, description, reference, date, items } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ error: 'Type and amount are required' });
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ error: 'Type must be INCOME or EXPENSE' });
    }

    const transaction = await transactionService.create(req.scopedBusinessId, req.user.id, {
      type, amount, categoryId, description, reference, date, items
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { type, categoryId, startDate, endDate, search, offset, limit } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (categoryId) filters.categoryId = categoryId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (search) filters.search = search;
    if (offset) filters.offset = parseInt(offset);
    if (limit) filters.limit = parseInt(limit);

    const transactions = await transactionService.getAll(req.scopedBusinessId, filters);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const transaction = await transactionService.getById(req.scopedBusinessId, req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const transaction = await transactionService.update(req.scopedBusinessId, req.params.id, req.body);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    await transactionService.delete(req.scopedBusinessId, req.params.id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const summary = await transactionService.getSummary(req.scopedBusinessId, startDate, endDate);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const transactions = await transactionService.getByDateRange(req.scopedBusinessId, startDate, endDate);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteTransaction,
  getSummary,
  getByDateRange
};
