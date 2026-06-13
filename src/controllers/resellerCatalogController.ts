import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as resellerCatalogService from '../services/resellerCatalogService';
import {
  updateCatalogSettingsSchema,
  updateWhatsappTemplateSchema,
} from '../validators/resellerValidator';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as whatsappUtils from '../utils/whatsapp';

// ─── Public Endpoints ─────────────────────────────────────────────

export const getCatalog = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const catalogData = await resellerCatalogService.getCatalogProducts(slug);
    return successResponse(res, 'Katalog reseller berhasil diambil', catalogData);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const getProductDetail = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const productId = req.params.productId;
    const productData = await resellerCatalogService.getCatalogProductDetail(
      slug,
      Number(productId)
    );
    return successResponse(res, 'Detail produk katalog berhasil diambil', productData);
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

export const getWhatsappLink = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const productId = req.params.productId;

    // 1. Fetch reseller catalog details with template
    const reseller = await resellerCatalogService.getCatalogBySlug(slug);
    if (!reseller.is_catalog_public) {
      throw new Error('Katalog reseller ini bersifat privat');
    }

    // 2. Fetch product details
    const productData = await resellerCatalogService.getCatalogProductDetail(
      slug,
      Number(productId)
    );
    const product = productData.product;

    // 3. Compile whatsapp template text
    const templateText =
      reseller.whatsappTemplate?.template ||
      'Halo kak {reseller_name}, saya ingin pesan:\n🌸 {product_name}\n💰 Rp {price}';

    const messagePreview = whatsappUtils.compileWhatsappMessage(templateText, {
      reseller_name: reseller.user?.name || '',
      shop_name: reseller.shop_name,
      product_name: product.name,
      price: product.price,
    });

    // 4. Generate URL link
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
        photo_url: (product as any).photo_url || null, // Handle optional photourl field
      },
    });
  } catch (err: any) {
    return errorResponse(res, err.message, null, 404);
  }
};

// ─── Reseller Authenticated Settings ──────────────────────────────

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const settings = await resellerCatalogService.getCatalogSettings(resellerId);
    return successResponse(res, 'Pengaturan katalog berhasil diambil', settings);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const data = updateCatalogSettingsSchema.parse(req.body);
    const settings = await resellerCatalogService.updateCatalogSettings(resellerId, data);
    return successResponse(res, 'Pengaturan katalog berhasil diperbarui', settings);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Pengaturan katalog tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message);
  }
};

export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const template = await resellerCatalogService.getWhatsappTemplate(resellerId);
    return successResponse(res, 'Template WhatsApp berhasil diambil', template);
  } catch (err: any) {
    return errorResponse(res, err.message);
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const resellerId = (req as any).reseller.id;
    const { template } = updateWhatsappTemplateSchema.parse(req.body);
    const updatedTemplate = await resellerCatalogService.updateWhatsappTemplate(
      resellerId,
      template
    );
    return successResponse(res, 'Template WhatsApp berhasil diperbarui', updatedTemplate);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return errorResponse(res, 'Template WhatsApp tidak valid', err.errors, 422);
    }
    return errorResponse(res, err.message);
  }
};
