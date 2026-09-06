const db = require('../models');
const logger = require('../utils/logger');

const Material = db.Material;

const getAllMaterials = async () => {
  return await Material.findAll();
};

const getMaterialById = async (id) => {
  return await Material.findByPk(id);
};

const createMaterial = async (data) => {
  const material = await Material.create(data);
  logger.info('Material created', { materialId: material.id, name: material.name });
  return material;
};

const updateMaterial = async (id, data) => {
  const material = await Material.findByPk(id);
  if (!material) {
    logger.warn('Update material failed: Material not found', { materialId: id });
    throw new Error('Material not found');
  }
  const updatedMaterial = await material.update(data);
  logger.info('Material updated', { materialId: id });
  return updatedMaterial;
};

const deleteMaterial = async (id) => {
  const material = await Material.findByPk(id);
  if (!material) {
    logger.warn('Delete material failed: Material not found', { materialId: id });
    throw new Error('Material not found');
  }
  await material.destroy();
  logger.info('Material deleted', { materialId: id });
  return;
};

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
};
