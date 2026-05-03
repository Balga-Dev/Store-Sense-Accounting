const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiration
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateBusinessCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SS-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateItemCode = (prefix = 'ITM') => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = `${prefix}-`;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const calculateTotals = (transactions) => {
  return transactions.reduce((acc, t) => {
    const amount = parseFloat(t.amount);
    if (t.type === 'INCOME') {
      acc.income += amount;
    } else {
      acc.expenses += amount;
    }
    acc.count += 1;
    return acc;
  }, { income: 0, expenses: 0, count: 0 });
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateBusinessCode,
  generateItemCode,
  formatDate,
  calculateTotals
};
