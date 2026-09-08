const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const productService = require('../services/productService');
const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().optional(),
  price: z.number().positive('Harga harus lebih dari 0'),
  is_active: z.boolean().optional(),
  category_id: z.number().optional(),
  type: z.enum(['ready', 'preorder']).optional(),
  preorder_duration: z.number().optional(),
});

const productChannelSchema = z.array(z.object({
  channel_id: z.number(),
  store_url: z.string().optional(),
})).min(1, 'Minimal 1 order channel');

const costTemplateSchema = z.object({
  name: z.string().min(1, 'Nama biaya wajib diisi'),
  cost_type: z.enum(['material', 'labor', 'overhead']),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
});

const bulkCostTemplateSchema = z.array(costTemplateSchema).min(1, 'Minimal 1 template biaya');

const getAllProducts = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
    const includeCosts = req.query.include_costs === 'true';
    
    const products = await productService.getAllProducts({ activeOnly, categoryId, includeCosts });
    return successResponse(res, 'Daftar produk berhasil diambil', products);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getProductById = async (req, res) => {
  try {
    const includeCosts = req.query.include_costs === 'true';
    const product = await productService.getProductById(Number(req.params.id), includeCosts);
    return successResponse(res, 'Produk berhasil diambil', product);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const includeCosts = req.query.include_costs === 'true';
    const product = await productService.getProductBySlug(req.params.slug, includeCosts);
    return successResponse(res, 'Produk berhasil diambil', product);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const createProduct = async (req, res) => {
  try {
    const data = createProductSchema.parse(req.body);
    const photo_url = req.file ? `/public/uploads/products/${req.file.filename}` : undefined;
    const product = await productService.createProduct({
      ...data,
      photo_url,
      gbp_post: req.body.gbp_post === 'true' || req.body.gbp_post === true,
      gbp_location: req.body.gbp_location || null,
    });
    return successResponse(res, 'Produk berhasil dibuat', product, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message);
  }
};

const updateProduct = async (req, res) => {
  try {
    const photo_url = req.file ? `/public/uploads/products/${req.file.filename}` : undefined;
    const product = await productService.updateProduct(Number(req.params.id), {
      ...req.body,
      ...(photo_url && { photo_url }),
      gbp_post: req.body.gbp_post === 'true' || req.body.gbp_post === true,
      gbp_location: req.body.gbp_location || null,
    });
    return successResponse(res, 'Produk berhasil diperbarui', product);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(Number(req.params.id));
    return successResponse(res, 'Produk berhasil dihapus');
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const getCostTemplates = async (req, res) => {
  try {
    const templates = await productService.getCostTemplates(Number(req.params.id));
    return successResponse(res, 'Template biaya berhasil diambil', templates);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const bulkAddCostTemplates = async (req, res) => {
  try {
    const templates = bulkCostTemplateSchema.parse(req.body);
    const created = await productService.bulkAddCostTemplates(Number(req.params.id), templates);
    return successResponse(res, `${created.length} template biaya berhasil ditambahkan`, created, 201);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message, null, 404);
  }
};

const deleteCostTemplate = async (req, res) => {
  try {
    await productService.deleteCostTemplate(Number(req.params.templateId));
    return successResponse(res, 'Template biaya berhasil dihapus');
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const setProductChannels = async (req, res) => {
  try {
    const channels = productChannelSchema.parse(req.body);
    const result = await productService.setProductChannels(Number(req.params.id), channels);
    return successResponse(res, 'Order channels produk berhasil diperbarui', result);
  } catch (err) {
    if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
    return errorResponse(res, err.message, null, 404);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getCostTemplates,
  bulkAddCostTemplates,
  deleteCostTemplate,
  setProductChannels,
};
