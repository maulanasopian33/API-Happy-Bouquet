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
  const { gbp_post, gbp_location, ...productData } = data;
  if (!productData.slug) {
    productData.slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  const product = await Product.create(productData);
  logger.info('Produk berhasil dibuat', { productId: product.id, name: product.name });

  if (gbp_post && gbp_location) {
    try {
      const { GoogleBusinessService } = require('./googleBusiness.service');
      let summary = product.name;
      if (product.price) summary += ` — Rp ${new Intl.NumberFormat('id-ID').format(product.price)}`;
      if (product.description) summary += `\n${product.description}`;
      const baseUrl = process.env.APP_URL || 'https://tokobunga.pinkplants.my.id';
      const ctaUrl = `${baseUrl}/produk/${product.slug}`;
      const mediaUrl = product.photo_url ? `${baseUrl}${product.photo_url}` : null;
      const result = await GoogleBusinessService.createPost(gbp_location, {
        summary,
        ctaType: 'SHOP',
        ctaUrl,
        mediaUrl,
      });
      if (!result.error) {
        await product.update({
          gbp_posted: true,
          gbp_posted_at: new Date(),
          gbp_post_name: result.name || null,
          gbp_location,
        });
        logger.info('Produk dipromosikan ke GBP', { productId: product.id, location: gbp_location });
      }
    } catch (e) {
      logger.error('Gagal post produk ke GBP', { error: e.message });
    }
  }

  return product;
};

const updateProduct = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Produk tidak ditemukan');

  const { gbp_post, gbp_location, ...productData } = data;
  if (productData.name && !productData.slug) {
    productData.slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  const updated = await product.update(productData);
  logger.info('Produk diperbarui', { productId: id });

  if (gbp_post && gbp_location) {
    try {
      const { GoogleBusinessService } = require('./googleBusiness.service');
      let summary = updated.name;
      if (updated.price) summary += ` — Rp ${new Intl.NumberFormat('id-ID').format(updated.price)}`;
      if (updated.description) summary += `\n${updated.description}`;
      const baseUrl = process.env.APP_URL || 'https://tokobunga.pinkplants.my.id';
      const ctaUrl = `${baseUrl}/produk/${updated.slug}`;
      const mediaUrl = updated.photo_url ? `${baseUrl}${updated.photo_url}` : null;

      if (updated.gbp_post_name) {
        await GoogleBusinessService.deletePost(updated.gbp_post_name).catch(() => {});
      }
      const result = await GoogleBusinessService.createPost(gbp_location, {
        summary,
        ctaType: 'SHOP',
        ctaUrl,
        mediaUrl,
      });
      if (!result.error) {
        await updated.update({
          gbp_posted: true,
          gbp_posted_at: new Date(),
          gbp_post_name: result.name || null,
          gbp_location,
        });
        logger.info('Produk dipromosikan ulang ke GBP', { productId: id, location: gbp_location });
      }
    } catch (e) {
      logger.error('Gagal post produk ke GBP', { error: e.message });
    }
  }

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
