const db = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const User = db.User;

const getAllUsersByRole = async (role) => {
  return await User.findAll({
    where: { role },
    attributes: { exclude: ['password'] }
  });
};

const getUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  });
};

const createUser = async (data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  const user = await User.create(data);
  logger.info('User created', { userId: user.id, role: user.role });
  return user;
};

const updateUser = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) {
    logger.warn('Update user failed: User not found', { userId: id });
    throw new Error('User not found');
  }
  
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  
  const updatedUser = await user.update(data);
  logger.info('User updated', { userId: id });
  return updatedUser;
};

const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    logger.warn('Delete user failed: User not found', { userId: id });
    throw new Error('User not found');
  }
  await user.destroy();
  logger.info('User deleted', { userId: id });
  return;
};

module.exports = {
  getAllUsersByRole,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
