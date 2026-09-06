const db = require('../models');
const logger = require('../utils/logger');

const ResellerClient = db.ResellerClient;
const Order = db.Order;

const getClients = async (resellerId) => {
  return await ResellerClient.findAll({
    where: { reseller_id: resellerId },
    order: [['name', 'ASC']],
  });
};

const getClientById = async (id, resellerId) => {
  const client = await ResellerClient.findOne({
    where: { id, reseller_id: resellerId },
  });
  if (!client) {
    throw new Error('Client not found');
  }

  const orders = await Order.findAll({
    where: { client_id: id, reseller_id: resellerId },
    order: [['createdAt', 'DESC']],
    limit: 10,
  });

  return {
    client,
    orders,
  };
};

const createClient = async (resellerId, data) => {
  const client = await ResellerClient.create({
    reseller_id: resellerId,
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    address: data.address || null,
    city: data.city || null,
    notes: data.notes || null,
    total_orders: 0,
    last_order_at: null,
  });

  logger.info('Reseller client created', { resellerId, clientId: client.id });
  return client;
};

const updateClient = async (id, resellerId, data) => {
  const client = await ResellerClient.findOne({
    where: { id, reseller_id: resellerId },
  });
  if (!client) {
    throw new Error('Client not found');
  }

  const updatedClient = await client.update(data);
  logger.info('Reseller client updated', { resellerId, clientId: id });
  return updatedClient;
};

const deleteClient = async (id, resellerId) => {
  const client = await ResellerClient.findOne({
    where: { id, reseller_id: resellerId },
  });
  if (!client) {
    throw new Error('Client not found');
  }

  await client.destroy();
  logger.info('Reseller client deleted', { resellerId, clientId: id });
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
