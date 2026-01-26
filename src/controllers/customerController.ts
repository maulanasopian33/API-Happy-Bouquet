import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { successResponse, errorResponse } from '../utils/response';

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

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const customer = await userService.updateUser(Number(id), updateData);
    return successResponse(res, 'Customer updated successfully', customer);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(Number(id));
    return successResponse(res, 'Customer deleted successfully');
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};
