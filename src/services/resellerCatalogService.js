const db = require('../models');
const logger = require('../utils/logger');

const Reseller = db.Reseller;
const ResellerCatalogSetting = db.ResellerCatalogSetting;
const ResellerWhatsappTemplate = db.ResellerWhatsappTemplate;
const Product = db.Product;
const ResellerProductVisibility = db.ResellerProductVisibility;
const User = db.User;

const getCatalogBySlug = async (slug) => {
  const reseller = await Reseller.findOne({
    where: { slug, status: 'active' },
    include: [
      { model: User, as: 'user', attributes: ['name', 'email'] },
      { model: ResellerCatalogSetting, as: 'catalogSetting' },
      { model: ResellerWhatsappTemplate, as: 'whatsappTemplate' },
    ],
  });

  if (!reseller) {
    throw new Error('Katalog reseller tidak ditemukan atau tidak aktif');
  }

  return reseller;
};

const getCatalogProducts = async (slug) => {
  const reseller = await getCatalogBySlug(slug);
  if (!reseller.is_catalog_public) {
    throw new Error('Katalog reseller ini bersifat privat');
  }

  const products = await Product.findAll({
    where: { is_active: true },
    include: [{ model: ResellerProductVisibility, as: 'visibility', required: false }],
  });

  const filteredProducts = products.filter(
    (p) => !p.visibility || p.visibility.is_resellable === true
  );

  return {
    reseller: {
      id: reseller.id,
      shop_name: reseller.shop_name,
      shop_bio: reseller.shop_bio,
      shop_logo_url: reseller.shop_logo_url,
      whatsapp_number: reseller.whatsapp_number,
    },
    settings: reseller.catalogSetting,
    products: filteredProducts,
  };
};

const getCatalogProductDetail = async (slug, productId) => {
  const reseller = await getCatalogBySlug(slug);
  if (!reseller.is_catalog_public) {
    throw new Error('Katalog reseller ini bersifat privat');
  }

  const product = await Product.findOne({
    where: { id: productId, is_active: true },
    include: [{ model: ResellerProductVisibility, as: 'visibility', required: false }],
  });

  if (!product || (product.visibility && product.visibility.is_resellable === false)) {
    throw new Error('Produk tidak ditemukan atau tidak tersedia');
  }

  return {
    reseller: {
      id: reseller.id,
      shop_name: reseller.shop_name,
      whatsapp_number: reseller.whatsapp_number,
    },
    product,
  };
};

const getCatalogSettings = async (resellerId) => {
  return await ResellerCatalogSetting.findOne({
    where: { reseller_id: resellerId },
  });
};

const updateCatalogSettings = async (resellerId, data) => {
  const settings = await ResellerCatalogSetting.findOne({
    where: { reseller_id: resellerId },
  });
  if (!settings) {
    throw new Error('Settings not found');
  }

  await settings.update(data);
  logger.info('Reseller catalog settings updated', { resellerId });
  return settings;
};

const getWhatsappTemplate = async (resellerId) => {
  return await ResellerWhatsappTemplate.findOne({
    where: { reseller_id: resellerId },
  });
};

const updateWhatsappTemplate = async (resellerId, template) => {
  const tpl = await ResellerWhatsappTemplate.findOne({
    where: { reseller_id: resellerId },
  });
  if (!tpl) {
    throw new Error('Template not found');
  }

  await tpl.update({ template });
  logger.info('Reseller WhatsApp template updated', { resellerId });
  return tpl;
};

module.exports = {
  getCatalogBySlug,
  getCatalogProducts,
  getCatalogProductDetail,
  getCatalogSettings,
  updateCatalogSettings,
  getWhatsappTemplate,
  updateWhatsappTemplate,
};
