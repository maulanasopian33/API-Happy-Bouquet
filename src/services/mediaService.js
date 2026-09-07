const db = require('../models');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const Media = db.Media;

const getAllMedia = async ({ page = 1, limit = 20, mimeType } = {}) => {
  const where = {};
  if (mimeType) where.mimeType = { [db.Sequelize.Op.like]: `${mimeType}%` };

  const offset = (page - 1) * limit;
  const { rows, count } = await Media.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [{ model: db.User, as: 'uploader', attributes: ['id', 'name'] }],
  });

  return {
    media: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getMediaById = async (id) => {
  const media = await Media.findByPk(id, {
    include: [{ model: db.User, as: 'uploader', attributes: ['id', 'name'] }],
  });
  if (!media) throw new Error('Media tidak ditemukan');
  return media;
};

const createMedia = async (file, uploadedById, alt = null) => {
  const media = await Media.create({
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: `public/uploads/media/${file.filename}`,
    alt,
    uploadedById,
  });
  logger.info('Media berhasil diupload', { mediaId: media.id, filename: file.filename });
  return media;
};

const updateMedia = async (id, data) => {
  const media = await Media.findByPk(id);
  if (!media) throw new Error('Media tidak ditemukan');
  const updated = await media.update(data);
  logger.info('Media diperbarui', { mediaId: id });
  return updated;
};

const deleteMedia = async (id) => {
  const media = await Media.findByPk(id);
  if (!media) throw new Error('Media tidak ditemukan');

  const filePath = path.join(__dirname, '../../', media.path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await media.destroy();
  logger.info('Media dihapus', { mediaId: id });
};

module.exports = {
  getAllMedia,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia,
};
