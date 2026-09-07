const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const mediaService = require('../services/mediaService');
const { z } = require('zod');

const altSchema = z.object({
  alt: z.string().optional(),
});

const getAllMedia = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const mimeType = req.query.mimeType || undefined;
    const result = await mediaService.getAllMedia({ page, limit, mimeType });
    return successResponse(res, 'Daftar media berhasil diambil', result);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getMediaById = async (req, res) => {
  try {
    const media = await mediaService.getMediaById(Number(req.params.id));
    return successResponse(res, 'Media berhasil diambil', media);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'File tidak ditemukan');
    const { alt } = altSchema.parse(req.body);
    const media = await mediaService.createMedia(req.file, req.user?.id, alt);
    return successResponse(res, 'Media berhasil diupload', media, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

const updateMedia = async (req, res) => {
  try {
    const data = altSchema.parse(req.body);
    const media = await mediaService.updateMedia(Number(req.params.id), data);
    return successResponse(res, 'Media berhasil diperbarui', media);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message, null, 404);
  }
};

const deleteMedia = async (req, res) => {
  try {
    await mediaService.deleteMedia(Number(req.params.id));
    return successResponse(res, 'Media berhasil dihapus');
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

module.exports = {
  getAllMedia,
  getMediaById,
  uploadMedia,
  updateMedia,
  deleteMedia,
};
