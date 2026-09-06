const crypto = require('crypto');
const logger = require('../utils/logger');
const userService = require('../services/userService');
const {
  createCustomerSchema,
  updateCustomerSchema,
} = require('../validators/customerValidator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');

const getAllCustomers = async (req, res) => {
  try {
    const customers = await userService.getAllUsersByRole('customer');
    return successResponse(res, 'Customers retrieved successfully', customers);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await userService.getUserById(Number(id));
    if (!customer || customer.role !== 'customer') {
      return errorResponse(res, 'Customer not found', null, 404);
    }
    return successResponse(res, 'Customer retrieved successfully', customer);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const createCustomer = async (req, res) => {
  try {
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return validationErrorResponse(res, parsed.error, 'Validasi gagal.', 400);
    }
    const data = parsed.data;
    const password = data.password || crypto.randomBytes(12).toString('hex');
    const customer = await userService.createUser({
      name: data.name,
      email: data.email,
      password,
      phone: data.phone,
      address: data.address,
      role: 'customer',
    });
    logger.info(`Customer created: ID ${customer.id}`);
    const { password: _pw, ...safeCustomer } = customer.toJSON();
    return successResponse(res, 'Customer created successfully', safeCustomer, 201);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return errorResponse(res, 'Email sudah terdaftar.', null, 409);
    }
    return errorResponse(res, error.message, null, 400);
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return validationErrorResponse(res, parsed.error, 'Validasi gagal.', 400);
    }
    const updateData = parsed.data;
    const customer = await userService.updateUser(Number(id), updateData);
    logger.info(`Customer updated: ID ${id}`);
    return successResponse(res, 'Customer updated successfully', customer);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(Number(id));
    logger.info(`Customer deleted: ID ${id}`);
    return successResponse(res, 'Customer deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
