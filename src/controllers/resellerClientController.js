const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const resellerClientService = require('../services/resellerClientService');
const { createClientSchema, updateClientSchema } = require('../validators/resellerValidator');

const listClients = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const clients = await resellerClientService.getClients(resellerId);
    return successResponse(res, 'Daftar client berhasil diambil', clients);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getClient = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const clientData = await resellerClientService.getClientById(
      Number(req.params.id),
      resellerId
    );
    return successResponse(res, 'Detail client berhasil diambil', clientData);
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

const createClient = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const data = createClientSchema.parse(req.body);
    const client = await resellerClientService.createClient(resellerId, data);
    return successResponse(res, 'Client berhasil didaftarkan', client, 201);
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Input client tidak valid', 422);
    }
    return errorResponse(res, err.message);
  }
};

const updateClient = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    const data = updateClientSchema.parse(req.body);
    const client = await resellerClientService.updateClient(
      Number(req.params.id),
      resellerId,
      data
    );
    return successResponse(res, 'Data client berhasil diperbarui', client);
  } catch (err) {
    if (err.name === 'ZodError') {
      return validationErrorResponse(res, err, 'Input pembaruan client tidak valid', 422);
    }
    return errorResponse(res, err.message, null, 404);
  }
};

const deleteClient = async (req, res) => {
  try {
    const resellerId = req.reseller.id;
    await resellerClientService.deleteClient(Number(req.params.id), resellerId);
    return successResponse(res, 'Client berhasil dihapus');
  } catch (err) {
    return errorResponse(res, err.message, null, 404);
  }
};

module.exports = {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
};
