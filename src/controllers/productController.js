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
  photo_url: z.string().optional(),
  gallery_urls: z.union([z.array(z.string()), z.string()]).optional(),
  variants: z.union([z.record(z.any()), z.array(z.any()), z.string()]).optional(),
  specifications: z.union([z.record(z.any()), z.string()]).optional(),
  stock: z.number().optional(),
  rating: z.number().optional(),
  review_count: z.number().optional(),
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

const canViewCosts = (req) => {
  if (req.user && ['admin', 'super_admin'].includes(String(req.user.role).toLowerCase())) {
    return true;
  }
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.hb_token;
  if (!token || token === 'null') return false;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, secret);
    return ['admin', 'super_admin'].includes(String(decoded.role).toLowerCase());
  } catch {
    return false;
  }
};

const getAllProducts = async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
    const includeCosts = canViewCosts(req) && req.query.include_costs === 'true';
    
    const products = await productService.getAllProducts({ activeOnly, categoryId, includeCosts });
    return successResponse(res, 'Daftar produk berhasil diambil', products);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const includeCosts = canViewCosts(req) && req.query.include_costs === 'true';
    const product = await productService.getProductBySlug(req.params.slug, includeCosts);
    return successResponse(res, 'Produk berhasil diambil', product);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const parseJsonSafe = (val) => {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
};

const createProduct = async (req, res) => {
  try {
    const data = createProductSchema.parse(req.body);
    const uploadedPhoto = req.file ? `/public/uploads/products/${req.file.filename}` : undefined;
    const photo_url = uploadedPhoto || data.photo_url;

    const product = await productService.createProduct({
      ...data,
      photo_url,
      gallery_urls: parseJsonSafe(data.gallery_urls),
      variants: parseJsonSafe(data.variants),
      specifications: parseJsonSafe(data.specifications),
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
    const uploadedPhoto = req.file ? `/public/uploads/products/${req.file.filename}` : undefined;
    const bodyData = { ...req.body };
    if (uploadedPhoto) bodyData.photo_url = uploadedPhoto;

    if (bodyData.gallery_urls !== undefined) bodyData.gallery_urls = parseJsonSafe(bodyData.gallery_urls);
    if (bodyData.variants !== undefined) bodyData.variants = parseJsonSafe(bodyData.variants);
    if (bodyData.specifications !== undefined) bodyData.specifications = parseJsonSafe(bodyData.specifications);
    if (bodyData.stock !== undefined) bodyData.stock = Number(bodyData.stock);
    if (bodyData.price !== undefined) bodyData.price = Number(bodyData.price);

    const product = await productService.updateProduct(Number(req.params.id), {
      ...bodyData,
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
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getCostTemplates,
  bulkAddCostTemplates,
  deleteCostTemplate,
  setProductChannels,
};
