import db from '../models';
import logger from '../utils/logger';

const ResellerClient = db.ResellerClient;
const Order = db.Order;

export const getClients = async (resellerId: number) => {
  return await ResellerClient.findAll({
    where: { reseller_id: resellerId },
    order: [['name', 'ASC']],
  });
};

export const getClientById = async (id: number, resellerId: number) => {
  const client = await ResellerClient.findOne({
    where: { id, reseller_id: resellerId },
  });
  if (!client) {
    throw new Error('Client not found');
  }

  // Fetch recent client orders
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

export const createClient = async (resellerId: number, data: any) => {
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

export const updateClient = async (id: number, resellerId: number, data: any) => {
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

export const deleteClient = async (id: number, resellerId: number) => {
  const client = await ResellerClient.findOne({
    where: { id, reseller_id: resellerId },
  });
  if (!client) {
    throw new Error('Client not found');
  }

  await client.destroy();
  logger.info('Reseller client deleted', { resellerId, clientId: id });
};
