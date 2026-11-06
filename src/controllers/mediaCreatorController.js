const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const templateService = require('../services/mediaCreatorTemplateService');
const projectService = require('../services/mediaCreatorProjectService');
const { POSITIONS } = require('../services/mediaCreatorRenderService');
const { z } = require('zod');

const positionEnum = z.enum(POSITIONS);

const templateFields = {
  name: z.string().trim().min(1, 'Nama template wajib diisi').max(100),
  width: z.coerce.number().int().min(200).max(2048),
  height: z.coerce.number().int().min(200).max(2048),
  watermark_media_id: z.coerce.number().int().positive().nullable().optional(),
  watermark_position: positionEnum,
  watermark_x: z.coerce.number().min(0).max(100).nullable().optional(),
  watermark_y: z.coerce.number().min(0).max(100).nullable().optional(),
  watermark_scale: z.coerce.number().int().min(5).max(100),
  watermark_opacity: z.coerce.number().int().min(0).max(100),
  margin: z.coerce.number().int().min(0).max(500),
  is_active: z.boolean(),
};

const createTemplateSchema = z.object({
  ...templateFields,
  watermark_position: positionEnum.default('bottom-right'),
  watermark_scale: templateFields.watermark_scale.default(18),
  watermark_opacity: templateFields.watermark_opacity.default(80),
  margin: templateFields.margin.default(32),
  is_active: templateFields.is_active.default(true),
});

const updateTemplateSchema = z.object(templateFields).partial();

const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Nama project wajib diisi').max(120),
  source_media_id: z.coerce.number().int().positive(),
  template_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, 'Pilih minimal satu template')
    .max(projectService.MAX_TEMPLATES),
});

const updateProjectSchema = createProjectSchema.partial();
const generateSchema = z.object({ template_id: z.coerce.number().int().positive() });

const fail = (res, err, fallbackStatus = 400) => {
  if (err.name === 'ZodError') return validationErrorResponse(res, err, 'Validasi gagal', 422);
  return errorResponse(res, err.message, null, err.statusCode || fallbackStatus);
};

const pagination = (query, defaultLimit = 20) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || defaultLimit));
  return { page, limit };
};

// ───── Template ─────

const getTemplates = async (req, res) => {
  try {
    const active =
      req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
    const data = await templateService.getAllTemplates({
      active,
      ...pagination(req.query, 50),
    });
    return successResponse(res, 'Daftar template berhasil diambil', data);
  } catch (err) {
    return fail(res, err);
  }
};

const getTemplate = async (req, res) => {
  try {
    const template = await templateService.getTemplateById(Number(req.params.id));
    return successResponse(res, 'Template berhasil diambil', template);
  } catch (err) {
    return fail(res, err);
  }
};

const createTemplate = async (req, res) => {
  try {
    const payload = createTemplateSchema.parse(req.body);
    const template = await templateService.createTemplate(payload);
    return successResponse(res, 'Template berhasil dibuat', template, 201);
  } catch (err) {
    return fail(res, err);
  }
};

const updateTemplate = async (req, res) => {
  try {
    const payload = updateTemplateSchema.parse(req.body);
    const template = await templateService.updateTemplate(Number(req.params.id), payload);
    return successResponse(res, 'Template berhasil diperbarui', template);
  } catch (err) {
    return fail(res, err);
  }
};

const deleteTemplate = async (req, res) => {
  try {
    await templateService.deleteTemplate(Number(req.params.id));
    return successResponse(res, 'Template berhasil dihapus');
  } catch (err) {
    return fail(res, err);
  }
};

// ───── Project ─────

const getProjects = async (req, res) => {
  try {
    const data = await projectService.getAllProjects({
      ...pagination(req.query, 12),
      status: req.query.status || undefined,
      q: req.query.q ? String(req.query.q).trim() : undefined,
    });
    return successResponse(res, 'Daftar project berhasil diambil', data);
  } catch (err) {
    return fail(res, err);
  }
};

const getProject = async (req, res) => {
  try {
    const project = await projectService.getProjectById(Number(req.params.id));
    return successResponse(res, 'Project berhasil diambil', project);
  } catch (err) {
    return fail(res, err);
  }
};

const createProject = async (req, res) => {
  try {
    const payload = createProjectSchema.parse(req.body);
    const project = await projectService.createProject(payload, req.user?.id);
    return successResponse(res, 'Project berhasil dibuat', project, 201);
  } catch (err) {
    return fail(res, err);
  }
};

const updateProject = async (req, res) => {
  try {
    const payload = updateProjectSchema.parse(req.body);
    const project = await projectService.updateProject(Number(req.params.id), payload);
    return successResponse(res, 'Project berhasil diperbarui', project);
  } catch (err) {
    return fail(res, err);
  }
};

const deleteProject = async (req, res) => {
  try {
    await projectService.deleteProject(Number(req.params.id));
    return successResponse(res, 'Project berhasil dihapus');
  } catch (err) {
    return fail(res, err);
  }
};

const generateOutput = async (req, res) => {
  try {
    const { template_id } = generateSchema.parse(req.body);
    const { output, warning } = await projectService.generateOutput(
      Number(req.params.id),
      template_id,
      req.user?.id
    );
    return successResponse(
      res,
      warning || 'Output berhasil dibuat',
      { ...output.toJSON(), warning }
    );
  } catch (err) {
    return fail(res, err, 500);
  }
};

const deleteOutput = async (req, res) => {
  try {
    await projectService.deleteOutput(Number(req.params.id), Number(req.params.outputId));
    return successResponse(res, 'Output berhasil dihapus');
  } catch (err) {
    return fail(res, err);
  }
};

module.exports = {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  generateOutput,
  deleteOutput,
};
