const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const heroBannerService = require('../services/heroBannerService');
const { z } = require('zod');

const bannerSchema = z.object({
  imageUrl: z.string().url('URL gambar tidak valid'),
  title: z.string().optional(),
  link: z.string().optional(),
  order: z.number().int().optional(),
});

const getAllBanners = async (req, res) => {
  try {
    const banners = await heroBannerService.getAllBanners();
    return successResponse(res, 'Daftar banner berhasil diambil', banners);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getBannerById = async (req, res) => {
  try {
    const banner = await heroBannerService.getBannerById(Number(req.params.id));
    return successResponse(res, 'Banner berhasil diambil', banner);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const createBanner = async (req, res) => {
  try {
    const data = bannerSchema.parse(req.body);
    const banner = await heroBannerService.createBanner(data);
    return successResponse(res, 'Banner berhasil dibuat', banner, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

const updateBanner = async (req, res) => {
  try {
    const data = bannerSchema.partial().parse(req.body);
    const banner = await heroBannerService.updateBanner(Number(req.params.id), data);
    return successResponse(res, 'Banner berhasil diperbarui', banner);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message, null, 404);
  }
};

const deleteBanner = async (req, res) => {
  try {
    await heroBannerService.deleteBanner(Number(req.params.id));
    return successResponse(res, 'Banner berhasil dihapus');
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

module.exports = {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
};
