import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { registerSchema } from '../utils/validation';
import { successResponse, errorResponse } from '../utils/response';

export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await userService.getAllUsersByRole('admin');
    return successResponse(res, 'Admins retrieved successfully', admins);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const adminData = { ...validatedData, role: 'admin' };
    const admin = await userService.createUser(adminData);
    return successResponse(res, 'Admin created successfully', admin, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse(res, 'Validation error', error.errors, 400);
    }
    return errorResponse(res, error.message, null, 500);
  }
};

export const getAdminById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await userService.getUserById(Number(id));
    if (!admin || admin.role !== 'admin') {
      return errorResponse(res, 'Admin not found', null, 404);
    }
    return successResponse(res, 'Admin retrieved successfully', admin);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const admin = await userService.updateUser(Number(id), updateData);
    return successResponse(res, 'Admin updated successfully', admin);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(Number(id));
    return successResponse(res, 'Admin deleted successfully');
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};
