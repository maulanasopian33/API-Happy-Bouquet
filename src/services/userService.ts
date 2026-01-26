import db from '../models';
import bcrypt from 'bcryptjs';

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
  return await User.create(data);
};

export const updateUser = async (id: number, data: any) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  
  return await user.update(data);
};

export const deleteUser = async (id: number) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  return await user.destroy();
};
