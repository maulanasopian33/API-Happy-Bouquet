import db from '../models';
import logger from '../utils/logger';


const Material = db.Material;

export const getAllMaterials = async () => {
  return await Material.findAll();
};

export const getMaterialById = async (id: number) => {
  return await Material.findByPk(id);
};

export const createMaterial = async (data: any) => {
  const material = await Material.create(data);
  logger.info('Material created', { materialId: material.id, name: material.name });
  return material;

};

export const updateMaterial = async (id: number, data: any) => {
  const material = await Material.findByPk(id);
  if (!material) {
    logger.warn('Update material failed: Material not found', { materialId: id });
    throw new Error('Material not found');
  }
  const updatedMaterial = await material.update(data);
  logger.info('Material updated', { materialId: id });
  return updatedMaterial;

};

export const deleteMaterial = async (id: number) => {
  const material = await Material.findByPk(id);
  if (!material) {
    logger.warn('Delete material failed: Material not found', { materialId: id });
    throw new Error('Material not found');
  }
  await material.destroy();
  logger.info('Material deleted', { materialId: id });
  return;

};
