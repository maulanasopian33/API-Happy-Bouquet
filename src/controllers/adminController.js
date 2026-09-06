const logger = require('../utils/logger');
const userService = require('../services/userService');
const { registerSchema } = require('../validators/authValidator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');

const getAllAdmins = async (req, res) => {
  try {
    const admins = await userService.getAllUsersByRole('admin');
    return successResponse(res, 'Admins retrieved successfully', admins);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const createAdmin = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const adminData = { ...validatedData, role: 'admin' };
    const admin = await userService.createUser(adminData);
    logger.info(`Admin created: ${admin.email}`);
    return successResponse(res, 'Admin created successfully', admin, 201);
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    }
    return errorResponse(res, error.message, null, 500);
  }
};

const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await userService.getUserById(Number(id));
    if (!admin || admin.role !== 'admin') {
      return errorResponse(res, 'Admin not found', null, 404);
    }
    return successResponse(res, 'Admin retrieved successfully', admin);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const admin = await userService.updateUser(Number(id), updateData);
    logger.info(`Admin updated: ID ${id}`);
    return successResponse(res, 'Admin updated successfully', admin);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(Number(id));
    logger.info(`Admin deleted: ID ${id}`);
    return successResponse(res, 'Admin deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

module.exports = {
  getAllAdmins,
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
