const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const service = require('../services/orderChannelService');
const { z } = require('zod');

const channelSchema = z.object({
  name: z.string().min(1, 'Nama channel wajib diisi'),
  icon_url: z.string().optional(),
  is_active: z.boolean().optional(),
});

const getAllChannels = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const channels = await service.getAllChannels(activeOnly);
    return successResponse(res, 'Daftar order channel berhasil diambil', channels);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getChannelById = async (req, res) => {
  try {
    const channel = await service.getChannelById(Number(req.params.id));
    return successResponse(res, 'Order channel berhasil diambil', channel);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const createChannel = async (req, res) => {
  try {
    const data = channelSchema.parse(req.body);
    const channel = await service.createChannel(data);
    return successResponse(res, 'Order channel berhasil dibuat', channel, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

const updateChannel = async (req, res) => {
  try {
    const data = channelSchema.partial().parse(req.body);
    const channel = await service.updateChannel(Number(req.params.id), data);
    return successResponse(res, 'Order channel berhasil diperbarui', channel);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message, null, 404);
  }
};

const deleteChannel = async (req, res) => {
  try {
    await service.deleteChannel(Number(req.params.id));
    return successResponse(res, 'Order channel berhasil dihapus');
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

module.exports = {
  getAllChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
};
