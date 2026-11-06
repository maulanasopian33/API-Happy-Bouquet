const db = require('../models');
const logger = require('../utils/logger');

const MediaCreatorTemplate = db.MediaCreatorTemplate;
const Media = db.Media;

const httpError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

const normalizePayload = (data, existing = {}) => {
  const merged = { ...existing, ...data };
  if (merged.watermark_position !== 'custom') {
    merged.watermark_x = null;
    merged.watermark_y = null;
  } else {
    merged.watermark_x = merged.watermark_x ?? 50;
    merged.watermark_y = merged.watermark_y ?? 90;
  }
  return merged;
};

const assertWatermarkMedia = async (mediaId) => {
  if (mediaId === null || mediaId === undefined) return null;
  const media = await Media.findByPk(mediaId);
  if (!media || !String(media.mimeType || '').startsWith('image/')) {
    throw httpError('Logo watermark tidak ditemukan atau bukan gambar', 422);
  }
  return media;
};

const getAllTemplates = async ({ active, page = 1, limit = 50 } = {}) => {
  const where = {};
  if (active !== undefined) where.is_active = active;

  const { rows, count } = await MediaCreatorTemplate.findAndCountAll({
    where,
    include: [{ model: Media, as: 'watermark', attributes: ['id', 'path', 'originalName'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    templates: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
};

const getTemplateById = async (id) => {
  const template = await MediaCreatorTemplate.findByPk(id, {
    include: [{ model: Media, as: 'watermark', attributes: ['id', 'path', 'originalName'] }],
  });
  if (!template) throw httpError('Template tidak ditemukan', 404);
  return template;
};

const createTemplate = async (data) => {
  await assertWatermarkMedia(data.watermark_media_id);
  const payload = normalizePayload(data);
  const template = await MediaCreatorTemplate.create(payload);
  logger.info('Template media creator dibuat', { templateId: template.id });
  return getTemplateById(template.id);
};

const updateTemplate = async (id, data) => {
  const template = await MediaCreatorTemplate.findByPk(id);
  if (!template) throw httpError('Template tidak ditemukan', 404);

  if (Object.prototype.hasOwnProperty.call(data, 'watermark_media_id')) {
    await assertWatermarkMedia(data.watermark_media_id);
  }

  const payload = normalizePayload(data, template.get({ plain: true }));
  await template.update(payload);
  logger.info('Template media creator diperbarui', { templateId: id });
  return getTemplateById(id);
};

const deleteTemplate = async (id) => {
  const template = await MediaCreatorTemplate.findByPk(id);
  if (!template) throw httpError('Template tidak ditemukan', 404);
  await template.destroy();
  logger.info('Template media creator dihapus', { templateId: id });
};

module.exports = {
  POSITIONS: require('./mediaCreatorRenderService').POSITIONS,
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
