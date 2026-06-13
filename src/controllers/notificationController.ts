import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as notificationService from '../services/notificationService';

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const data = await notificationService.getNotificationLogs(user.id, page, limit);
    return successResponse(res, 'Notifikasi berhasil diambil', data);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
