const db = require('../models');
const logger = require('../utils/logger');
const mediaService = require('./mediaService');
const renderService = require('./mediaCreatorRenderService');

const { Op } = db.Sequelize;
const Media = db.Media;
const MediaCreatorTemplate = db.MediaCreatorTemplate;
const MediaCreatorProject = db.MediaCreatorProject;
const MediaCreatorOutput = db.MediaCreatorOutput;

const MAX_TEMPLATES = 8;
const activeRenders = new Set();

const httpError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const asArray = (value) => (Array.isArray(value) ? value.map(Number) : []);

const mediaAttributes = ['id', 'path', 'originalName', 'mimeType', 'size'];
const outputInclude = {
  model: MediaCreatorOutput,
  as: 'outputs',
  include: [{ model: Media, as: 'media', attributes: mediaAttributes }],
};
const projectInclude = [
  { model: Media, as: 'sourceMedia', attributes: mediaAttributes },
  outputInclude,
];

const assertSourceMedia = async (mediaId) => {
  const media = await Media.findByPk(mediaId);
  if (!media || !String(media.mimeType || '').startsWith('image/')) {
    throw httpError('Foto sumber tidak ditemukan atau bukan gambar', 422);
  }
  return media;
};

const assertTemplates = async (templateIds) => {
  const ids = [...new Set(asArray(templateIds))].filter(Number.isInteger);
  if (ids.length < 1) throw httpError('Pilih minimal satu template', 422);
  if (ids.length > MAX_TEMPLATES) {
    throw httpError(`Maksimal ${MAX_TEMPLATES} template per project`, 422);
  }

  const found = await MediaCreatorTemplate.findAll({
    where: { id: ids, is_active: true },
    attributes: ['id'],
  });
  if (found.length !== ids.length) {
    throw httpError('Ada template yang tidak ditemukan atau nonaktif', 422);
  }
  return ids;
};

const getAllProjects = async ({ page = 1, limit = 12, status, q } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (q) where.name = { [Op.like]: `%${q}%` };

  const { rows, count } = await MediaCreatorProject.findAndCountAll({
    where,
    include: projectInclude,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return {
    projects: rows,
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
};

const getProjectById = async (id) => {
  const project = await MediaCreatorProject.findByPk(id, { include: projectInclude });
  if (!project) throw httpError('Project tidak ditemukan', 404);
  return project;
};

const createProject = async ({ name, source_media_id, template_ids }, userId) => {
  const source = await assertSourceMedia(source_media_id);
  const ids = await assertTemplates(template_ids);

  const project = await MediaCreatorProject.create({
    name,
    source_media_id: source.id,
    template_ids: ids,
    created_by: userId || null,
    status: 'draft',
  });

  logger.info('Project media creator dibuat', { projectId: project.id });
  return getProjectById(project.id);
};

const removeOutput = async (output) => {
  const mediaId = output.media_id;
  // Hapus baris output dulu agar FK media tidak menghalangi (DB cascade berbeda antar lingkungan).
  await output.destroy();
  const media = await Media.findByPk(mediaId);
  if (media) await mediaService.deleteMedia(mediaId);
};

const deleteOutputs = async (projectId) => {
  const outputs = await MediaCreatorOutput.findAll({ where: { project_id: projectId } });
  for (const output of outputs) {
    await removeOutput(output);
  }
};

const refreshStatus = async (projectId) => {
  const project = await MediaCreatorProject.findByPk(projectId, {
    include: [{ model: MediaCreatorOutput, as: 'outputs', attributes: ['id', 'template_id'] }],
  });
  if (!project) return;

  const selected = asArray(project.template_ids);
  const done = new Set(project.outputs.map((o) => Number(o.template_id)));
  const status =
    project.outputs.length === 0
      ? 'draft'
      : selected.length > 0 && selected.every((id) => done.has(id))
        ? 'done'
        : 'partial';

  await project.update({ status });
};

const updateProject = async (id, { name, source_media_id, template_ids } = {}) => {
  const project = await MediaCreatorProject.findByPk(id);
  if (!project) throw httpError('Project tidak ditemukan', 404);

  const data = {};
  let sourceChanged = false;

  if (name !== undefined) data.name = name;
  if (source_media_id !== undefined) {
    const source = await assertSourceMedia(source_media_id);
    sourceChanged = Number(source.id) !== Number(project.source_media_id);
    data.source_media_id = source.id;
  }
  if (template_ids !== undefined) {
    data.template_ids = await assertTemplates(template_ids);
  }

  await project.update(data);

  // Foto sumber berganti → hasil lama tidak relevan, bersihkan agar tidak menyesatkan.
  if (sourceChanged) await deleteOutputs(project.id);
  await refreshStatus(project.id);

  return getProjectById(project.id);
};

const deleteProject = async (id) => {
  const project = await MediaCreatorProject.findByPk(id);
  if (!project) throw httpError('Project tidak ditemukan', 404);

  await deleteOutputs(project.id);
  await project.destroy();
  logger.info('Project media creator dihapus', { projectId: id });
};

const generateOutput = async (projectId, templateId, userId) => {
  if (activeRenders.has(projectId)) {
    throw httpError('Generate untuk project ini sedang berjalan', 409);
  }
  activeRenders.add(projectId);

  let writtenAbsPath = null;
  let createdMediaId = null;

  try {
    const project = await MediaCreatorProject.findByPk(projectId, {
      include: [{ model: Media, as: 'sourceMedia', attributes: mediaAttributes }],
    });
    if (!project) throw httpError('Project tidak ditemukan', 404);

    if (!asArray(project.template_ids).includes(Number(templateId))) {
      throw httpError('Template bukan bagian dari project ini', 422);
    }

    const template = await MediaCreatorTemplate.findByPk(templateId);
    if (!template || !template.is_active) {
      throw httpError('Template tidak ditemukan atau nonaktif', 422);
    }
    if (!project.sourceMedia) throw httpError('Foto sumber project tidak ditemukan', 422);

    const sourcePath = renderService.resolveUploadPath(project.sourceMedia.path);
    const watermarkMedia = template.watermark_media_id
      ? await Media.findByPk(template.watermark_media_id)
      : null;
    const watermarkPath = watermarkMedia
      ? renderService.resolveUploadPath(watermarkMedia.path)
      : null;

    const startedAt = Date.now();
    const rendered = await renderService.withTimeout(
      renderService.renderImage({ sourcePath, watermarkPath, template })
    );

    const file = await renderService.writeOutputFile({
      projectId: project.id,
      templateName: template.name,
      buffer: rendered.buffer,
    });
    writtenAbsPath = file.absPath;

    // Generate ulang harus mengganti output lama, bukan menambah baris baru.
    const existing = await MediaCreatorOutput.findAll({
      where: { project_id: project.id, template_id: template.id },
    });
    for (const output of existing) await removeOutput(output);

    const media = await Media.create({
      filename: file.filename,
      originalName: `${project.name} - ${template.name}.png`,
      mimeType: 'image/png',
      size: rendered.buffer.length,
      path: file.relPath,
      alt: `${project.name} - ${template.name}`,
      uploadedById: userId || null,
    });
    createdMediaId = media.id;

    const output = await MediaCreatorOutput.create({
      project_id: project.id,
      template_id: template.id,
      media_id: media.id,
      template_name: template.name,
      width: rendered.width,
      height: rendered.height,
      file_size: rendered.buffer.length,
      config: {
        width: rendered.width,
        height: rendered.height,
        watermark_media_id: template.watermark_media_id,
        watermark_position: template.watermark_position,
        watermark_x: template.watermark_x,
        watermark_y: template.watermark_y,
        watermark_scale: template.watermark_scale,
        watermark_opacity: template.watermark_opacity,
        margin: template.margin,
      },
    });

    await refreshStatus(project.id);
    logger.info('Output media creator dibuat', {
      projectId: project.id,
      outputId: output.id,
      durationMs: Date.now() - startedAt,
    });

    const result = await MediaCreatorOutput.findByPk(output.id, {
      include: [{ model: Media, as: 'media', attributes: mediaAttributes }],
    });
    return { output: result, warning: rendered.warning || null };
  } catch (err) {
    if (writtenAbsPath) await renderService.deleteFileQuietly(writtenAbsPath);
    if (createdMediaId) await Media.destroy({ where: { id: createdMediaId } });
    throw err;
  } finally {
    activeRenders.delete(projectId);
  }
};

const deleteOutput = async (projectId, outputId) => {
  const output = await MediaCreatorOutput.findOne({
    where: { id: outputId, project_id: projectId },
  });
  if (!output) throw httpError('Output tidak ditemukan', 404);

  await removeOutput(output);
  await refreshStatus(projectId);
};

module.exports = {
  MAX_TEMPLATES,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  generateOutput,
  deleteOutput,
};
