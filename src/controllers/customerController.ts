import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

import * as userService from '../services/userService';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../validators/customerValidator';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response';

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await userService.getAllUsersByRole('customer');
    return successResponse(res, 'Customers retrieved successfully', customers);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await userService.getUserById(Number(id));
    if (!customer || customer.role !== 'customer') {
      return errorResponse(res, 'Customer not found', null, 404);
    }
    return successResponse(res, 'Customer retrieved successfully', customer);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return validationErrorResponse(res, parsed.error, 'Validasi gagal.', 400);
    }
    const data = parsed.data;
    // Password default acak bila tidak dikirim (panel tidak punya field password).
    // Customer tetap bisa reset via admin bila perlu.
    const password = data.password || crypto.randomBytes(12).toString('hex');
    const customer = await userService.createUser({
      name: data.name,
      email: data.email,
      password,
      phone: data.phone,
      address: data.address,
      role: 'customer',
    });
    logger.info(`Customer created: ID ${customer.id}`);
    // Jangan ekspos password hash ke klien
    const { password: _pw, ...safeCustomer } = customer.toJSON();
    return successResponse(res, 'Customer created successfully', safeCustomer, 201);
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'Email sudah terdaftar.', null, 409);
    }
    return errorResponse(res, error.message, null, 400);
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return validationErrorResponse(res, parsed.error, 'Validasi gagal.', 400);
    }
    const updateData = parsed.data;
    const customer = await userService.updateUser(Number(id), updateData);
    logger.info(`Customer updated: ID ${id}`);
    return successResponse(res, 'Customer updated successfully', customer);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(Number(id));
    logger.info(`Customer deleted: ID ${id}`);
    return successResponse(res, 'Customer deleted successfully');
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};
