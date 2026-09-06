const db = require('../models');
const logger = require('../utils/logger');

const OrderChannel = db.OrderChannel;

const getAllChannels = async (activeOnly = false) => {
  const where = activeOnly ? { is_active: true } : {};
  return await OrderChannel.findAll({ where });
};

const getChannelById = async (id) => {
  const channel = await OrderChannel.findByPk(id);
  if (!channel) throw new Error('Order channel tidak ditemukan');
  return channel;
};

const createChannel = async (data) => {
  const channel = await OrderChannel.create(data);
  logger.info('Order channel berhasil dibuat', { channelId: channel.id, name: channel.name });
  return channel;
};

const updateChannel = async (id, data) => {
  const channel = await getChannelById(id);
  const updated = await channel.update(data);
  logger.info('Order channel diperbarui', { channelId: id });
  return updated;
};

const deleteChannel = async (id) => {
  const channel = await getChannelById(id);
  await channel.destroy();
  logger.info('Order channel dihapus', { channelId: id });
};

module.exports = {
  getAllChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
};
