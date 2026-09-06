const db = require('../models');
const logger = require('../utils/logger');

const Product = db.Product;
const ProductCostTemplate = db.ProductCostTemplate;

const getAllProducts = async (filters = {}) => {
  const where = {};
  if (filters.activeOnly) where.is_active = true;
  if (filters.categoryId) where.category_id = filters.categoryId;

  const include = [{ model: db.Category, as: 'category' }];
  
  if (filters.includeCosts) {
    include.push({ model: ProductCostTemplate, as: 'costTemplates' });
  }

  include.push({ model: db.OrderChannel, as: 'orderChannels' });

  return await Product.findAll({ where, include });
};

const getProductById = async (id, includeCosts = false) => {
  const include = [
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

const getProductBySlug = async (slug, includeCosts = false) => {
  const include = [
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

const createProduct = async (data) => {
  if (!data.slug) {
    data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  const product = await Product.create(data);
  logger.info('Produk berhasil dibuat', { productId: product.id, name: product.name });
  return product;
};

const updateProduct = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Produk tidak ditemukan');
  
  if (data.name && !data.slug) {
    data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  const updated = await product.update(data);
  logger.info('Produk diperbarui', { productId: id });
  return updated;
};

const deleteProduct = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Produk tidak ditemukan');
  await product.destroy();
  logger.info('Produk dihapus', { productId: id });
};

const getCostTemplates = async (productId) => {
  await getProductById(productId);
  return await ProductCostTemplate.findAll({ where: { product_id: productId } });
};

const addCostTemplate = async (productId, data) => {
  await getProductById(productId);
  const template = await ProductCostTemplate.create({ product_id: productId, ...data });
  logger.info('Template biaya produk ditambahkan', { productId, templateId: template.id });
  return template;
};

const bulkAddCostTemplates = async (
  productId,
  templates
) => {
  await getProductById(productId);
  const items = templates.map((t) => ({ product_id: productId, ...t }));
  const created = await ProductCostTemplate.bulkCreate(items);
  logger.info(`${created.length} template biaya produk dibuat untuk produk ${productId}`);
  return created;
};

const deleteCostTemplate = async (templateId) => {
  const template = await ProductCostTemplate.findByPk(templateId);
  if (!template) throw new Error('Template biaya tidak ditemukan');
  await template.destroy();
  logger.info('Template biaya dihapus', { templateId });
};

const setProductChannels = async (productId, channels) => {
  await getProductById(productId);
  
  const channelIds = channels.map((c) => c.channel_id);
  const existingChannels = await db.OrderChannel.findAll({
    where: { id: channelIds }
  });

  if (existingChannels.length !== [...new Set(channelIds)].length) {
    throw new Error('Satu atau lebih Order Channel ID tidak ditemukan di database. Pastikan anda sudah membuat channel tersebut di menu Sistem Order.');
  }

  return await db.sequelize.transaction(async (t) => {
    await db.ProductOrderChannel.destroy({ where: { product_id: productId }, transaction: t });
    const items = channels.map((c) => ({ product_id: productId, ...c }));
    const created = await db.ProductOrderChannel.bulkCreate(items, { transaction: t });
    logger.info(`Set ${created.length} order channels for product ${productId}`);
    return created;
  });
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getCostTemplates,
  addCostTemplate,
  bulkAddCostTemplates,
  deleteCostTemplate,
  setProductChannels,
};
