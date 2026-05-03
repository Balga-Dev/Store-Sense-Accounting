const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { businessCode, username, password } = req.body;

    if (!businessCode || !username || !password) {
      return res.status(400).json({ error: 'Business code, username, and password are required' });
    }

    const result = await authService.login(businessCode, username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const superAdminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await authService.superAdminLogin(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json(profile);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  login,
  superAdminLogin,
  getProfile,
  changePassword
};
