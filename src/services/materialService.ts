import db from '../models';

const Material = db.Material;

export const getAllMaterials = async () => {
  return await Material.findAll();
};

export const getMaterialById = async (id: number) => {
  return await Material.findByPk(id);
};

export const createMaterial = async (data: any) => {
  return await Material.create(data);
};

export const updateMaterial = async (id: number, data: any) => {
  const material = await Material.findByPk(id);
  if (!material) {
    throw new Error('Material not found');
  }
  return await material.update(data);
};

export const deleteMaterial = async (id: number) => {
  const material = await Material.findByPk(id);
  if (!material) {
    throw new Error('Material not found');
  }
  return await material.destroy();
};
