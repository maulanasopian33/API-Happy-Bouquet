import { Response } from 'express';

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
  return res.status(statusCode).json(response);
};
