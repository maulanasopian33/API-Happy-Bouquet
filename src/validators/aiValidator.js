const { z } = require('zod');

const generationOptions = {
  model: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/, 'Nama model tidak valid')
    .optional(),
  systemInstruction: z.string().max(8000, 'System instruction terlalu panjang').optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().int().min(1).max(8192).optional(),
  json: z.boolean().optional(),
  timeoutMs: z.number().int().min(1000).max(120000).optional(),
};

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt wajib diisi').max(20000, 'Prompt terlalu panjang'),
  ...generationOptions,
});

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'assistant']),
        text: z.string().min(1, 'Teks pesan wajib diisi').max(20000, 'Pesan terlalu panjang'),
      })
    )
    .min(1, 'Minimal satu pesan')
    .max(50, 'Maksimal 50 pesan'),
  ...generationOptions,
});

module.exports = { generateSchema, chatSchema };
