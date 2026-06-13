import { Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as resellerClientService from '../services/resellerClientService';
import { createClientSchema, updateClientSchema } from '../validators/resellerValidator';
import { AuthRequest } from '../middlewares/authMiddleware';

export const listClients = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const clients = await resellerClientService.getClients(resellerId);
    return successResponse(res, 'Daftar client berhasil diambil', clients);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const clientData = await resellerClientService.getClientById(
      Number(req.params.id),
      resellerId
    );
    return successResponse(res, 'Detail client berhasil diambil', clientData);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const data = createClientSchema.parse(req.body);
    const client = await resellerClientService.createClient(resellerId, data);
    return successResponse(res, 'Client berhasil didaftarkan', client, 201);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Input client tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message);
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const data = updateClientSchema.parse(req.body);
    const client = await resellerClientService.updateClient(
      Number(req.params.id),
      resellerId,
      data
    );
    return successResponse(res, 'Data client berhasil diperbarui', client);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Input pembaruan client tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message, null, 404);
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    await resellerClientService.deleteClient(Number(req.params.id), resellerId);
    return successResponse(res, 'Client berhasil dihapus');
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};
