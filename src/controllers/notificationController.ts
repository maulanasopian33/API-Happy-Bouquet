import { Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as notificationService from '../services/notificationService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Autentikasi diperlukan', null, 401);
    }
    const user = req.user;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const data = await notificationService.getNotificationLogs(user.id, page, limit);
    return successResponse(res, 'Notifikasi berhasil diambil', data);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};
