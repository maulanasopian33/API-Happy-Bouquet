import db from '../models';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';


const User = db.User;

export const getAllUsersByRole = async (role: string) => {
  return await User.findAll({
    where: { role },
    attributes: { exclude: ['password'] }
  });
};

export const getUserById = async (id: number) => {
  return await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  });
};

export const createUser = async (data: any) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  const user = await User.create(data);
  logger.info('User created', { userId: user.id, role: user.role });
  return user;

};

export const updateUser = async (id: number, data: any) => {
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

export const deleteUser = async (id: number) => {
  const user = await User.findByPk(id);
  if (!user) {
    logger.warn('Delete user failed: User not found', { userId: id });
    throw new Error('User not found');
  }
  await user.destroy();
  logger.info('User deleted', { userId: id });
  return;

};
