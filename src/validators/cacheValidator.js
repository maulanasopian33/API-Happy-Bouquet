const { z } = require('zod');

const sourceSchema = z.enum(['local', 'upstash']).optional();

const setKeySchema = z.object({
  key: z.string().min(1, 'Key wajib diisi').max(512, 'Key terlalu panjang'),
  value: z.union([z.string(), z.object({}), z.array(z.unknown())]),
  ttl: z.number().int().positive('TTL harus positif').optional(),
  source: sourceSchema,
});

const setExpirySchema = z.object({
  params: z.object({
    key: z.string().min(1, 'Key wajib diisi'),
  }),
  body: z
    .object({
      ttl: z.number().int().positive('TTL harus positif').optional(),
      ttlMs: z.number().int().positive('TTL milliseconds harus positif').optional(),
      source: sourceSchema,
    })
    .refine((data) => data.ttl || data.ttlMs, {
      message: 'TTL (seconds) atau ttlMs (milliseconds) wajib diisi salah satunya',
    }),
});

const keyParamSchema = z.object({
  params: z.object({
    key: z.string().min(1, 'Key wajib diisi'),
  }),
  source: sourceSchema,
});

const listKeysQuerySchema = z.object({
  pattern: z.string().default('*'),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  source: sourceSchema,
});

const sourceQuerySchema = z.object({
  source: sourceSchema,
});

module.exports = {
  setKeySchema,
  setExpirySchema,
  keyParamSchema,
  listKeysQuerySchema,
  sourceQuerySchema,
};
