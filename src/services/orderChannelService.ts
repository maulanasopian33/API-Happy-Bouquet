import db from '../models';
import logger from '../utils/logger';

const OrderChannel = db.OrderChannel;

export const getAllChannels = async (activeOnly: boolean = false) => {
  const where = activeOnly ? { is_active: true } : {};
  return await OrderChannel.findAll({ where });
};

export const getChannelById = async (id: number) => {
  const channel = await OrderChannel.findByPk(id);
  if (!channel) throw new Error('Order channel tidak ditemukan');
  return channel;
};

export const createChannel = async (data: { name: string; icon_url?: string; is_active?: boolean }) => {
  const channel = await OrderChannel.create(data as any);
  logger.info('Order channel berhasil dibuat', { channelId: channel.id, name: channel.name });
  return channel;
};

export const updateChannel = async (id: number, data: Partial<{ name: string; icon_url: string; is_active: boolean }>) => {
  const channel = await getChannelById(id);
  const updated = await channel.update(data);
  logger.info('Order channel diperbarui', { channelId: id });
  return updated;
};

export const deleteChannel = async (id: number) => {
  const channel = await getChannelById(id);
  await channel.destroy();
  logger.info('Order channel dihapus', { channelId: id });
};
