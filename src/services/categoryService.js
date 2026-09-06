const db = require('../models');
const logger = require('../utils/logger');

const Category = db.Category;

const getAllCategories = async () => {
  return await Category.findAll();
};

const getCategoryById = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('Kategori tidak ditemukan');
  return category;
};

const createCategory = async (data) => {
  const category = await Category.create(data);
  logger.info('Kategori berhasil dibuat', { categoryId: category.id, name: category.name });
  return category;
};

const updateCategory = async (id, data) => {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('Kategori tidak ditemukan');
  const updated = await category.update(data);
  logger.info('Kategori diperbarui', { categoryId: id });
  return updated;
};

const deleteCategory = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('Kategori tidak ditemukan');
  await category.destroy();
  logger.info('Kategori dihapus', { categoryId: id });
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
