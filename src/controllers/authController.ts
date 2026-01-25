import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { registerSchema } from '../utils/validation';
import { successResponse, errorResponse } from '../utils/response';

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.register(validatedData);
    return successResponse(res, 'User registered successfully', user, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse(res, 'Validation error', error.errors, 400);
    } else {
      return errorResponse(res, error.message, null, 400);
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return successResponse(res, 'Login successful', result, 200);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 401);
  }
};
