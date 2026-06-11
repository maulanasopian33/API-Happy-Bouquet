import db from '../models';
import logger from '../utils/logger';

const Product = db.Product;
const ProductCostTemplate = db.ProductCostTemplate;

// ─── Product CRUD ────────────────────────────────────────────────

export const getAllProducts = async (filters: { activeOnly?: boolean; categoryId?: number; includeCosts?: boolean } = {}) => {
  const where: any = {};
  if (filters.activeOnly) where.is_active = true;
  if (filters.categoryId) where.category_id = filters.categoryId;

  const include: any[] = [{ model: db.Category, as: 'category' }];
  
  if (filters.includeCosts) {
    include.push({ model: ProductCostTemplate, as: 'costTemplates' });
  }

  // Always include order channels for product list/detail
  include.push({ model: db.OrderChannel, as: 'orderChannels' });

  return await Product.findAll({ where, include });
};

export const getProductById = async (id: number, includeCosts: boolean = false) => {
  const include: any[] = [
    { model: db.Category, as: 'category' },
    { model: db.OrderChannel, as: 'orderChannels' }
  ];
  
  if (includeCosts) {
    include.push({ model: ProductCostTemplate, as: 'costTemplates' });
  }

  const product = await Product.findByPk(id, { include });
  if (!product) throw new Error('Produk tidak ditemukan');
  return product;
};

export const getProductBySlug = async (slug: string, includeCosts: boolean = false) => {
  const include: any[] = [
    { model: db.Category, as: 'category' },
    { model: db.OrderChannel, as: 'orderChannels' }
  ];
  
  if (includeCosts) {
    include.push({ model: ProductCostTemplate, as: 'costTemplates' });
  }

  const product = await Product.findOne({
    where: { slug },
    include,
  });
  if (!product) throw new Error('Produk tidak ditemukan');
  return product;
};

export const createProduct = async (data: {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  photo_url?: string;
  is_active?: boolean;
  category_id?: number;
  type?: 'ready' | 'preorder';
  preorder_duration?: number;
}) => {
  if (!data.slug) {
    data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  const product = await Product.create(data as any);
  logger.info('Produk berhasil dibuat', { productId: product.id, name: product.name });
  return product;
};

export const updateProduct = async (id: number, data: Partial<{ 
  name: string; 
  slug: string; 
  description: string; 
  price: number; 
  photo_url: string; 
  is_active: boolean; 
  category_id: number;
  type: 'ready' | 'preorder';
  preorder_duration: number;
}>) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Produk tidak ditemukan');
  
  if (data.name && !data.slug) {
    data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

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

// ─── Order Channel Management ────────────────────────────────────

export const setProductChannels = async (productId: number, channels: Array<{ channel_id: number; store_url?: string }>) => {
  await getProductById(productId); // validate product exists
  
  // Validate all channel IDs exist
  const channelIds = channels.map((c) => c.channel_id);
  const existingChannels = await db.OrderChannel.findAll({
    where: { id: channelIds }
  });

  if (existingChannels.length !== [...new Set(channelIds)].length) {
    throw new Error('Satu atau lebih Order Channel ID tidak ditemukan di database. Pastikan anda sudah membuat channel tersebut di menu Sistem Order.');
  }

  // Use transaction to ensure consistency
  return await db.sequelize.transaction(async (t: any) => {
    await db.ProductOrderChannel.destroy({ where: { product_id: productId }, transaction: t });
    const items = channels.map((c) => ({ product_id: productId, ...c }));
    const created = await db.ProductOrderChannel.bulkCreate(items, { transaction: t });
    logger.info(`Set ${created.length} order channels for product ${productId}`);
    return created;
  });
};
