import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as service from '../services/orderChannelService';
import { z } from 'zod';

const channelSchema = z.object({
  name: z.string().min(1, 'Nama channel wajib diisi'),
  icon_url: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const getAllChannels = async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === 'true';
    const channels = await service.getAllChannels(activeOnly);
    return successResponse(res, 'Daftar order channel berhasil diambil', channels);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getChannelById = async (req: Request, res: Response) => {
  try {
    const channel = await service.getChannelById(Number(req.params.id));
    return successResponse(res, 'Order channel berhasil diambil', channel);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const createChannel = async (req: Request, res: Response) => {
  try {
    const data = channelSchema.parse(req.body);
    const channel = await service.createChannel(data);
    return successResponse(res, 'Order channel berhasil dibuat', channel, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message);
  }
};

export const updateChannel = async (req: Request, res: Response) => {
  try {
    const data = channelSchema.partial().parse(req.body);
    const channel = await service.updateChannel(Number(req.params.id), data);
    return successResponse(res, 'Order channel berhasil diperbarui', channel);
  } catch (err: any) {
    if (err.name === 'ZodError') return errorResponse(res, 'Validasi gagal', err.errors, 422);
    return errorResponse(res, err.message, null, 404);
  }
};

export const deleteChannel = async (req: Request, res: Response) => {
  try {
    await service.deleteChannel(Number(req.params.id));
    return successResponse(res, 'Order channel berhasil dihapus');
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};
