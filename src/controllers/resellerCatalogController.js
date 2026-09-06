const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const resellerCatalogService = require('../services/resellerCatalogService');
const {
  updateCatalogSettingsSchema,
  updateWhatsappTemplateSchema,
} = require('../validators/resellerValidator');
const whatsappUtils = require('../utils/whatsapp');

const getCatalog = async (req, res) => {
  try {
    const slug = req.params.slug;
    const catalogData = await resellerCatalogService.getCatalogProducts(slug);
    return successResponse(res, 'Katalog reseller berhasil diambil', catalogData);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const getProductDetail = async (req, res) => {
  try {
    const slug = req.params.slug;
    const productId = req.params.productId;
    const productData = await resellerCatalogService.getCatalogProductDetail(
      slug,
      Number(productId)
    );
    return successResponse(res, 'Detail produk katalog berhasil diambil', productData);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const getWhatsappLink = async (req, res) => {
  try {
    const slug = req.params.slug;
    const productId = req.params.productId;

    const reseller = await resellerCatalogService.getCatalogBySlug(slug);
    if (!reseller.is_catalog_public) {
      throw new Error('Katalog reseller ini bersifat privat');
    }

    const productData = await resellerCatalogService.getCatalogProductDetail(
      slug,
      Number(productId)
    );
    const product = productData.product;

    const templateText =
      reseller.whatsappTemplate?.template ||
      'Halo kak {reseller_name}, saya ingin pesan:\n🌸 {product_name}\n💰 Rp {price}';

    const messagePreview = whatsappUtils.compileWhatsappMessage(templateText, {
      reseller_name: reseller.user?.name || '',
      shop_name: reseller.shop_name,
      product_name: product.name,
      price: product.price,
    });

    const whatsappUrl = whatsappUtils.generateWhatsappLink(
      reseller.whatsapp_number,
      messagePreview
    );

    return successResponse(res, 'Link WhatsApp berhasil dibuat', {
      whatsapp_url: whatsappUrl,
      message_preview: messagePreview,
      reseller_phone: whatsappUtils.normalizePhoneNumber(reseller.whatsapp_number),
      product: {
        name: product.name,
        price: product.price,
        photo_url: product.photo_url || null,
      },
    });
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const getSettings = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const settings = await resellerCatalogService.getCatalogSettings(resellerId);
    return successResponse(res, 'Pengaturan katalog berhasil diambil', settings);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const updateSettings = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const data = updateCatalogSettingsSchema.parse(req.body);
    const settings = await resellerCatalogService.updateCatalogSettings(resellerId, data);
    return successResponse(res, 'Pengaturan katalog berhasil diperbarui', settings);
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Pengaturan katalog tidak valid', 422);
    }
    return errorResponse(res, err.message);
  }
};

const getTemplate = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const template = await resellerCatalogService.getWhatsappTemplate(resellerId);
    return successResponse(res, 'Template WhatsApp berhasil diambil', template);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const updateTemplate = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const { template } = updateWhatsappTemplateSchema.parse(req.body);
    const updatedTemplate = await resellerCatalogService.updateWhatsappTemplate(
      resellerId,
      template
    );
    return successResponse(res, 'Template WhatsApp berhasil diperbarui', updatedTemplate);
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Template WhatsApp tidak valid', 422);
    }
    return errorResponse(res, err.message);
  }
};

module.exports = {
  getCatalog,
  getProductDetail,
  getWhatsappLink,
  getSettings,
  updateSettings,
  getTemplate,
  updateTemplate,
};
