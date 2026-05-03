const userService = require('../services/userService');

const create = async (req, res) => {
  try {
    const { username, password, email, fullName, roleId, mustResetPassword } = req.body;

    if (!username || !password || !roleId) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    const user = await userService.create(req.scopedBusinessId, {
      username, password, email, fullName, roleId, mustResetPassword
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { isActive, roleId, search } = req.query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (roleId) filters.roleId = roleId;
    if (search) filters.search = search;

    const users = await userService.getAll(req.scopedBusinessId, filters);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const user = await userService.getById(req.scopedBusinessId, req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const user = await userService.update(req.scopedBusinessId, req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await userService.resetPassword(req.scopedBusinessId, req.params.id, newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const user = await userService.toggleStatus(req.scopedBusinessId, req.params.id);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.scopedBusinessId, req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const setTabOverride = async (req, res) => {
  try {
    const { permissionId, isEnabled } = req.body;
    if (!permissionId || isEnabled === undefined) {
      return res.status(400).json({ error: 'permissionId and isEnabled are required' });
    }

    const override = await userService.setTabOverride(
      req.scopedBusinessId, req.params.userId, permissionId, isEnabled
    );
    res.json(override);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const setActionOverride = async (req, res) => {
  try {
    const { permissionId, isEnabled } = req.body;
    if (!permissionId || isEnabled === undefined) {
      return res.status(400).json({ error: 'permissionId and isEnabled are required' });
    }

    const override = await userService.setActionOverride(
      req.scopedBusinessId, req.params.userId, permissionId, isEnabled
    );
    res.json(override);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const clearTabOverride = async (req, res) => {
  try {
    await userService.clearTabOverride(req.scopedBusinessId, req.params.userId, req.params.permissionId);
    res.json({ message: 'Tab override cleared' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const clearActionOverride = async (req, res) => {
  try {
    await userService.clearActionOverride(req.scopedBusinessId, req.params.userId, req.params.permissionId);
    res.json({ message: 'Action override cleared' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getEffectivePermissions = async (req, res) => {
  try {
    const permissions = await userService.getEffectivePermissions(req.params.userId);
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
  resetPassword,
  toggleStatus,
  delete: deleteUser,
  setTabOverride,
  setActionOverride,
  clearTabOverride,
  clearActionOverride,
  getEffectivePermissions
};
