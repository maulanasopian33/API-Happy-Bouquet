const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const categoryService = require('../services/categoryService');
const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  icon: z.string().optional(),
});

const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    return successResponse(res, 'Daftar kategori berhasil diambil', categories);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(Number(req.params.id));
    return successResponse(res, 'Kategori berhasil diambil', category);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const createCategory = async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await categoryService.createCategory(data);
    return successResponse(res, 'Kategori berhasil dibuat', category, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

const updateCategory = async (req, res) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const category = await categoryService.updateCategory(Number(req.params.id), data);
    return successResponse(res, 'Kategori berhasil diperbarui', category);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message, null, 404);
  }
};

const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(Number(req.params.id));
    return successResponse(res, 'Kategori berhasil dihapus');
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
