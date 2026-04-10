import db from '../models';
import logger from '../utils/logger';

const Product = db.Product;
const ProductCostTemplate = db.ProductCostTemplate;

// ─── Product CRUD ────────────────────────────────────────────────

export const getAllProducts = async (filters: { activeOnly?: boolean; categoryId?: number } = {}) => {
  const where: any = {};
  if (filters.activeOnly) where.is_active = true;
  if (filters.categoryId) where.category_id = filters.categoryId;

  return await Product.findAll({ 
    where, 
    include: [
      { model: ProductCostTemplate, as: 'costTemplates' },
      { model: db.Category, as: 'category' }
    ] 
  });
};

export const getProductById = async (id: number) => {
  const product = await Product.findByPk(id, {
    include: [
      { model: ProductCostTemplate, as: 'costTemplates' },
      { model: db.Category, as: 'category' }
    ],
  });
  if (!product) throw new Error('Produk tidak ditemukan');
  return product;
};

export const createProduct = async (data: {
  name: string;
  description?: string;
  price: number;
  photo_url?: string;
  is_active?: boolean;
  category_id?: number;
}) => {
  const product = await Product.create(data);
  logger.info('Produk berhasil dibuat', { productId: product.id, name: product.name });
  return product;
};

export const updateProduct = async (id: number, data: Partial<{ name: string; description: string; price: number; photo_url: string; is_active: boolean; category_id: number }>) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Produk tidak ditemukan');
  const updated = await product.update(data);
  logger.info('Produk diperbarui', { productId: id });
  return updated;
};

export const deleteProduct = async (id: number) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Produk tidak ditemukan');
  await product.destroy();
  logger.info('Produk dihapus', { productId: id });
};

// ─── Cost Template Management ────────────────────────────────────

export const getCostTemplates = async (productId: number) => {
  await getProductById(productId); // validasi product exists
  return await ProductCostTemplate.findAll({ where: { product_id: productId } });
};

export const addCostTemplate = async (productId: number, data: {
  name: string;
  cost_type: 'material' | 'labor' | 'overhead';
  amount: number;
}) => {
  await getProductById(productId); // validasi product exists
  const template = await ProductCostTemplate.create({ product_id: productId, ...data });
  logger.info('Template biaya produk ditambahkan', { productId, templateId: template.id });
  return template;
};

export const bulkAddCostTemplates = async (
  productId: number,
  templates: Array<{ name: string; cost_type: 'material' | 'labor' | 'overhead'; amount: number }>
) => {
  await getProductById(productId); // validasi product exists
  const items = templates.map((t) => ({ product_id: productId, ...t }));
  const created = await ProductCostTemplate.bulkCreate(items);
  logger.info(`${created.length} template biaya produk dibuat untuk produk ${productId}`);
  return created;
};

export const deleteCostTemplate = async (templateId: number) => {
  const template = await ProductCostTemplate.findByPk(templateId);
  if (!template) throw new Error('Template biaya tidak ditemukan');
  await template.destroy();
  logger.info('Template biaya dihapus', { templateId });
};
