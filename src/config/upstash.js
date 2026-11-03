const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

const command = async (...args) => {
  if (!isConfigured) {
    throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN belum dikonfigurasi');
  }

  let res;
  try {
    res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args.map(String)),
    });
  } catch (error) {
    logger.error('Upstash REST request failed:', error);
    throw error;
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.error) {
    const message = payload.error || `Upstash REST error ${res.status}`;
    logger.error(`Upstash REST error: ${message}`);
    throw new Error(message);
  }

  return payload.result;
};

module.exports = { isConfigured, command };
