import { Response } from 'express';
import logger from './logger';
import { ErrorCodes } from '../constants/errors';

interface ApiResponse {
  status: boolean;
  message: string;
  data?: any;
  error?: any;
}

export const successResponse = (res: Response, message: string, data: any = null, statusCode: number = 200) => {
  const response: ApiResponse = {
    status: true,
    message,
    data,
    error: null,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (res: Response, message: string, error: any = null, statusCode: number = 400) => {
  const response: ApiResponse = {
    status: false,
    message,
    data: null,
    error,
  };
  logger.error(message, { error });
  return res.status(statusCode).json(response);
};

/**
 * Respons standar untuk kegagalan validasi Zod (Zod v4: pakai `.issues`, bukan `.errors`).
 */
export const validationErrorResponse = (
  res: Response,
  error: any,
  message = 'Validation error',
  statusCode = 400
) => {
  return errorResponse(res, message, { code: ErrorCodes.VALIDATION_ERROR, issues: error.issues || [] }, statusCode);
};
