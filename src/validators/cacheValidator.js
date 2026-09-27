const { z } = require('zod');

const setKeySchema = z.object({
  body: z.object({
    key: z.string().min(1, 'Key wajib diisi').max(512, 'Key terlalu panjang'),
    value: z.union([z.string(), z.object({}), z.array(z.unknown())]),
    ttl: z.number().int().positive('TTL harus positif').optional()
  })
});

const setExpirySchema = z.object({
  params: z.object({
    key: z.string().min(1, 'Key wajib diisi')
  }),
  body: z.object({
    ttl: z.number().int().positive('TTL harus positif').optional(),
    ttlMs: z.number().int().positive('TTL milliseconds harus positif').optional()
  }).refine(data => data.ttl || data.ttlMs, {
    message: 'TTL (seconds) atau ttlMs (milliseconds) wajib diisi salah satunya'
  })
});

const keyParamSchema = z.object({
  params: z.object({
    key: z.string().min(1, 'Key wajib diisi')
  })
});

const listKeysQuerySchema = z.object({
  query: z.object({
    pattern: z.string().default('*'),
    limit: z.coerce.number().int().positive().max(1000).default(100)
  })
});

module.exports = {
  setKeySchema,
  setExpirySchema,
  keyParamSchema,
  listKeysQuerySchema
};