import { Request, Response } from 'express';
import * as materialService from '../services/materialService';
import { materialSchema } from '../utils/validation';
import { successResponse, errorResponse } from '../utils/response';

export const getAllMaterials = async (req: Request, res: Response) => {
  try {
    const materials = await materialService.getAllMaterials();
    return successResponse(res, 'Materials retrieved successfully', materials);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};

export const getMaterialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const material = await materialService.getMaterialById(Number(id));
    if (!material) {
      return errorResponse(res, 'Material not found', null, 404);
    }
    return successResponse(res, 'Material retrieved successfully', material);
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};

export const createMaterial = async (req: Request, res: Response) => {
  try {
    const validatedData = materialSchema.parse(req.body);
    const photo_url = req.file ? `/uploads/materials/${req.file.filename}` : null;
    
    const materialData = {
      ...validatedData,
      photo_url,
    };

    const material = await materialService.createMaterial(materialData);
    return successResponse(res, 'Material created successfully', material, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse(res, 'Validation error', error.errors, 400);
    }
    return errorResponse(res, error.message, null, 500);
  }
};

export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = materialSchema.partial().parse(req.body); // Allow partial updates
    const photo_url = req.file ? `/uploads/materials/${req.file.filename}` : undefined;

    const updateData = {
      ...validatedData,
      ...(photo_url && { photo_url }),
    };

    const material = await materialService.updateMaterial(Number(id), updateData);
    return successResponse(res, 'Material updated successfully', material);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse(res, 'Validation error', error.errors, 400);
    }
    return errorResponse(res, error.message, null, 500);
  }
};

export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await materialService.deleteMaterial(Number(id));
    return successResponse(res, 'Material deleted successfully');
  } catch (error: any) {
    return errorResponse(res, error.message, null, 500);
  }
};
