const db = require('../models');
const logger = require('../utils/logger');

class GoogleBusinessProductService {
  /**
   * List semua produk GBP (dengan filter opsional)
   */
  static async list({ page = 1, limit = 20, category, is_active, is_posted, search } = {}) {
    const where = {};
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active;
    if (is_posted !== undefined) where.is_posted = is_posted;
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await db.GoogleBusinessProduct.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return {
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get detail produk
   */
  static async getById(id) {
    return await db.GoogleBusinessProduct.findByPk(id);
  }

  /**
   * Buat produk baru
   */
  static async create(data, userId) {
    const product = await db.GoogleBusinessProduct.create({
      name: data.name,
      description: data.description || null,
      price: data.price || null,
      category: data.category || null,
      photo_url: data.photo_url || null,
      cta_type: data.cta_type || 'SHOP',
      cta_url: data.cta_url || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      updated_by: userId,
    });
    return product;
  }

  /**
   * Update produk
   */
  static async update(id, data, userId) {
    const product = await db.GoogleBusinessProduct.findByPk(id);
    if (!product) return null;

    const fields = ['name', 'description', 'price', 'category', 'photo_url', 'cta_type', 'cta_url', 'is_active'];
    for (const field of fields) {
      if (data[field] !== undefined) {
        product[field] = data[field];
      }
    }
    product.updated_by = userId;
    await product.save();
    return product;
  }

  /**
   * Hapus produk
   */
  static async delete(id) {
    const product = await db.GoogleBusinessProduct.findByPk(id);
    if (!product) return null;
    await product.destroy();
    return product;
  }

  /**
   * Promosikan produk ke Google Maps (create post)
   */
  static async promote(id, locationV4Name, userId) {
    const { GoogleBusinessService } = require('./googleBusiness.service');

    const product = await db.GoogleBusinessProduct.findByPk(id);
    if (!product) return { error: { message: 'Produk tidak ditemukan', status: 404 } };

    let summary = `${product.name}`;
    if (product.price) {
      summary += ` — Rp ${new Intl.NumberFormat('id-ID').format(product.price)}`;
    }
    if (product.description) {
      summary += `\n${product.description}`;
    }
    summary = summary.substring(0, 1500);

    const postData = {
      summary,
      ctaType: product.cta_type,
      ctaUrl: product.cta_url,
      mediaUrl: product.photo_url || null,
    };

    const result = await GoogleBusinessService.createPost(locationV4Name, postData);

    if (result.error) return result;

    product.is_posted = true;
    product.posted_at = new Date();
    product.posted_location = locationV4Name;
    product.post_name = result.name || null;
    product.updated_by = userId;
    await product.save();

    return { product, post: result };
  }

  /**
   * Hapus postingan dari Google Maps (hapus post, tapi produk tetap ada)
   */
  static async unpromote(id, userId) {
    const { GoogleBusinessService } = require('./googleBusiness.service');

    const product = await db.GoogleBusinessProduct.findByPk(id);
    if (!product) return { error: { message: 'Produk tidak ditemukan', status: 404 } };

    if (product.post_name) {
      const result = await GoogleBusinessService.deletePost(product.post_name);
      if (result.error) return result;
    }

    product.is_posted = false;
    product.posted_at = null;
    product.posted_location = null;
    product.post_name = null;
    product.updated_by = userId;
    await product.save();

    return { product };
  }

  /**
   * Ambil semua kategori unik
   */
  static async getCategories() {
    const products = await db.GoogleBusinessProduct.findAll({
      attributes: ['category'],
      where: { category: { [require('sequelize').Op.ne]: null } },
      group: ['category'],
    });
    return products.map(p => p.category).filter(Boolean);
  }
}

module.exports = { GoogleBusinessProductService };
