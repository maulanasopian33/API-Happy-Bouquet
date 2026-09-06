const logger = require('../utils/logger');
const materialService = require('../services/materialService');
const { materialSchema } = require('../validators/materialValidator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');

const getAllMaterials = async (req, res) => {
  try {
    const materials = await materialService.getAllMaterials();
    return successResponse(res, 'Materials retrieved successfully', materials);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await materialService.getMaterialById(Number(id));
    if (!material) {
      return errorResponse(res, 'Material not found', null, 404);
    }
    return successResponse(res, 'Material retrieved successfully', material);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const createMaterial = async (req, res) => {
  try {
    const validatedData = materialSchema.parse(req.body);
    const photo_url = req.file ? `/public/uploads/materials/${req.file.filename}` : null;
    
    const materialData = {
      ...validatedData,
      photo_url,
    };

    const material = await materialService.createMaterial(materialData);
    logger.info(`Material created: ${material.name} (ID: ${material.id})`);
    return successResponse(res, 'Material created successfully', material, 201);
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    }
    return errorResponse(res, error.message, null, 500);
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = materialSchema.partial().parse(req.body);
    const photo_url = req.file ? `/public/uploads/materials/${req.file.filename}` : undefined;

    const updateData = {
      ...validatedData,
      ...(photo_url && { photo_url }),
    };

    const material = await materialService.updateMaterial(Number(id), updateData);
    logger.info(`Material updated: ID ${id}`);
    return successResponse(res, 'Material updated successfully', material);
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    }
    return errorResponse(res, error.message, null, 500);
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await materialService.deleteMaterial(Number(id));
    logger.info(`Material deleted: ID ${id}`);
    return successResponse(res, 'Material deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
};
