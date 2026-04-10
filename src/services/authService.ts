import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../models';
import logger from '../utils/logger';

import { RegisterInput, LoginInput } from '../utils/types';

const User = db.User;

export const register = async (input: RegisterInput) => {
  const existingUser = await User.findOne({ where: { email: input.email } });
  if (existingUser) {
    logger.warn('Registration attempt with existing email', { email: input.email });
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    ...input,
    password: hashedPassword,
  });

  logger.info('User registered successfully', { userId: user.id, email: user.email });
  return user;
};

export const login = async (input: LoginInput) => {
  const user = await User.findOne({ where: { email: input.email } });
  if (!user) {
    logger.warn('Login attempt for non-existent user', { email: input.email });
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    logger.warn('Login attempt with invalid password', { userId: user.id, email: user.email });
    throw new Error('Invalid credentials');
  }

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  const secret = process.env.JWT_SECRET || 'secret';
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, {
    expiresIn: '1d',
  });

  return { user, token };
};
