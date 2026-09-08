const { GoogleBusinessProductService } = require('../services/googleBusinessProduct.service');
const { successResponse, errorResponse } = require('../utils/response');

class GoogleBusinessProductController {
  static async list(req, res) {
    try {
      const { page, limit, category, is_active, is_posted, search } = req.query;
      const result = await GoogleBusinessProductService.list({
        page, limit, category,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        is_posted: is_posted !== undefined ? is_posted === 'true' : undefined,
        search,
      });
      successResponse(res, 'Daftar produk GBP berhasil diambil', result);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async getById(req, res) {
    try {
      const product = await GoogleBusinessProductService.getById(req.params.id);
      if (!product) return errorResponse(res, 'Produk tidak ditemukan', null, 404);
      successResponse(res, 'Detail produk berhasil diambil', product);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async create(req, res) {
    try {
      const { name, description, price, category, photo_url, cta_type, cta_url, is_active } = req.body;
      if (!name) return errorResponse(res, 'Nama produk wajib diisi', null, 400);

      const product = await GoogleBusinessProductService.create(
        { name, description, price, category, photo_url, cta_type, cta_url, is_active },
        req.user?.id
      );
      successResponse(res, 'Produk berhasil ditambahkan', product, 201);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async update(req, res) {
    try {
      const product = await GoogleBusinessProductService.update(req.params.id, req.body, req.user?.id);
      if (!product) return errorResponse(res, 'Produk tidak ditemukan', null, 404);
      successResponse(res, 'Produk berhasil diperbarui', product);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async delete(req, res) {
    try {
      const product = await GoogleBusinessProductService.delete(req.params.id);
      if (!product) return errorResponse(res, 'Produk tidak ditemukan', null, 404);
      successResponse(res, 'Produk berhasil dihapus');
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async promote(req, res) {
    try {
      const { locationV4Name } = req.body;
      if (!locationV4Name) return errorResponse(res, 'Lokasi wajib dipilih', null, 400);

      const result = await GoogleBusinessProductService.promote(req.params.id, locationV4Name, req.user?.id);
      if (result.error) return errorResponse(res, result.error.message, result.error, result.error.status || 500);
      successResponse(res, 'Produk berhasil dipromosikan ke Google Maps', result);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async unpromote(req, res) {
    try {
      const result = await GoogleBusinessProductService.unpromote(req.params.id, req.user?.id);
      if (result.error) return errorResponse(res, result.error.message, result.error, result.error.status || 500);
      successResponse(res, 'Postingan produk berhasil dihapus dari Google Maps', result);
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }

  static async getCategories(req, res) {
    try {
      const categories = await GoogleBusinessProductService.getCategories();
      successResponse(res, 'Kategori berhasil diambil', { categories });
    } catch (error) {
      errorResponse(res, error.message, null, 500);
    }
  }
}

module.exports = { GoogleBusinessProductController };
