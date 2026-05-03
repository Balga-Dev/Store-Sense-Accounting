const roleService = require('../services/roleService');

const create = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const role = await roleService.create(req.scopedBusinessId, { name, description });
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const roles = await roleService.getAll(req.scopedBusinessId);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const role = await roleService.getById(req.scopedBusinessId, req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const role = await roleService.update(req.scopedBusinessId, req.params.id, req.body);
    res.json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    await roleService.delete(req.scopedBusinessId, req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const setTabPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions array is required' });
    }

    await roleService.setTabPermissions(req.scopedBusinessId, req.params.id, permissions);
    res.json({ message: 'Tab permissions updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const setActionPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions array is required' });
    }

    await roleService.setActionPermissions(req.scopedBusinessId, req.params.id, permissions);
    res.json({ message: 'Action permissions updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getDefaultPermissions = async (req, res) => {
  try {
    const permissions = await roleService.getDefaultPermissions();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteRole,
  setTabPermissions,
  setActionPermissions,
  getDefaultPermissions
};
