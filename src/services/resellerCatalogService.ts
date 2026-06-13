import db from '../models';
import logger from '../utils/logger';

const Reseller = db.Reseller;
const ResellerCatalogSetting = db.ResellerCatalogSetting;
const ResellerWhatsappTemplate = db.ResellerWhatsappTemplate;
const Product = db.Product;
const ResellerProductVisibility = db.ResellerProductVisibility;
const User = db.User;

export const getCatalogBySlug = async (slug: string) => {
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

export const getCatalogProducts = async (slug: string) => {
  const reseller = await getCatalogBySlug(slug);
  if (!reseller.is_catalog_public) {
    throw new Error('Katalog reseller ini bersifat privat');
  }

  // Fetch all active products
  const products = await Product.findAll({
    where: { is_active: true },
    include: [{ model: ResellerProductVisibility, as: 'visibility', required: false }],
  });

  // Filter out products that are explicitly marked as not resellable
  const filteredProducts = products.filter(
    (p: any) => !p.visibility || p.visibility.is_resellable === true
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

export const getCatalogProductDetail = async (slug: string, productId: number) => {
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

export const getCatalogSettings = async (resellerId: number) => {
  return await ResellerCatalogSetting.findOne({
    where: { reseller_id: resellerId },
  });
};

export const updateCatalogSettings = async (resellerId: number, data: any) => {
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

export const getWhatsappTemplate = async (resellerId: number) => {
  return await ResellerWhatsappTemplate.findOne({
    where: { reseller_id: resellerId },
  });
};

export const updateWhatsappTemplate = async (resellerId: number, template: string) => {
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
