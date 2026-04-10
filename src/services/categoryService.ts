import db from '../models';
import logger from '../utils/logger';

const Category = db.Category;

export const getAllCategories = async () => {
  return await Category.findAll();
};

export const getCategoryById = async (id: number) => {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('Kategori tidak ditemukan');
  return category;
};

export const createCategory = async (data: { name: string; icon?: string }) => {
  const category = await Category.create(data);
  logger.info('Kategori berhasil dibuat', { categoryId: category.id, name: category.name });
  return category;
};

export const updateCategory = async (id: number, data: Partial<{ name: string; icon: string }>) => {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('Kategori tidak ditemukan');
  const updated = await category.update(data);
  logger.info('Kategori diperbarui', { categoryId: id });
  return updated;
};

export const deleteCategory = async (id: number) => {
  const category = await Category.findByPk(id);
  if (!category) throw new Error('Kategori tidak ditemukan');
  await category.destroy();
  logger.info('Kategori dihapus', { categoryId: id });
};
