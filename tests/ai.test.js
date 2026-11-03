const request = require('supertest');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const app = require('../src/app');
const db = require('../src/models');
const geminiService = require('../src/services/geminiService');

const mockGeminiResponse = (text, finishReason = 'STOP') => ({
  ok: true,
  status: 200,
  json: async () => ({
    candidates: [{ content: { parts: [{ text }] }, finishReason }],
    usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 7, totalTokenCount: 12 },
  }),
});

describe('AI Gemini — /api/ai', () => {
  let adminToken;
  let customerToken;
  const originalFetch = global.fetch;
  const originalKey = process.env.GEMINI_API_KEY;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await db.User.bulkCreate([
      {
        name: 'Admin AI',
        email: 'admin@ai.test',
        password: await bcrypt.hash('password123', 10),
        role: 'admin',
      },
      {
        name: 'Customer AI',
        email: 'customer@ai.test',
        password: await bcrypt.hash('password123', 10),
        role: 'customer',
      },
    ]);

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ai.test', password: 'password123' });
    adminToken = adminLogin.body.data.token;

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@ai.test', password: 'password123' });
    customerToken = customerLogin.body.data.token;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  afterAll(async () => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    global.fetch = originalFetch;
    await db.sequelize.close();
  });

  it('GET /status tanpa token -> 401', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.status).toBe(401);
  });

  it('GET /status dengan role non-admin -> 403', async () => {
    const res = await request(app)
      .get('/api/ai/status')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('POST /generate tanpa prompt -> 400 VALIDATION_ERROR', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /status melaporkan configured + daftar model', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        models: [
          { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/embedding-001', supportedGenerationMethods: ['embedContent'] },
        ],
      }),
    }));

    const res = await request(app)
      .get('/api/ai/status')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.configured).toBe(true);
    expect(typeof res.body.data.model).toBe('string');
    expect(res.body.data.models).toEqual(['gemini-3.8-flash']);
  });

  it('POST /generate sukses memakai fetch yang di-mock', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = jest.fn(async () => mockGeminiResponse('Halo dari Gemini'));

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Sapa saya', systemInstruction: 'Jawab singkat' });

    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('Halo dari Gemini');
    expect(res.body.data.usage.totalTokens).toBe(12);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers['x-goog-api-key']).toBe('test-key');
    const payload = JSON.parse(options.body);
    expect(payload.systemInstruction.parts[0].text).toBe('Jawab singkat');
    expect(payload.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });

  it('POST /generate ulangi tanpa thinkingConfig bila model menolaknya (400)', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    let calls = 0;
    global.fetch = jest.fn(async () => {
      calls += 1;
      if (calls === 1) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: { code: 400, message: 'Unknown field thinkingConfig' } }),
        };
      }
      return mockGeminiResponse('ok tanpa thinking');
    });

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Halo', temperature: 0.5 });

    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('ok tanpa thinking');
    const retryPayload = JSON.parse(global.fetch.mock.calls[1][1].body);
    expect(retryPayload.generationConfig.thinkingConfig).toBeUndefined();
  });

  it('POST /generate mode JSON mem-parse hasil (termasuk code fence)', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = jest.fn(async () => mockGeminiResponse('```json\n{"judul":"Buket"}\n```'));

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Buat judul', json: true });

    expect(res.status).toBe(200);
    expect(res.body.data.json).toEqual({ judul: 'Buket' });
  });

  it('POST /generate memakai model pilihan dari request', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = jest.fn(async () => mockGeminiResponse('ok'));

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Halo', model: 'gemini-3.8-pro' });

    expect(res.status).toBe(200);
    expect(res.body.data.model).toBe('gemini-3.8-pro');
    expect(global.fetch.mock.calls[0][0]).toContain('/models/gemini-3.8-pro:generateContent');
  });

  it('POST /generate menolak nama model tidak valid -> 400', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Halo', model: '../../etc/passwd' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /generate fallback otomatis saat model deprecated (404)', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    let generateCalls = 0;
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes('generateContent')) {
        generateCalls += 1;
        if (generateCalls === 1) {
          return {
            ok: false,
            status: 404,
            json: async () => ({
              error: { code: 404, message: 'no longer available', status: 'NOT_FOUND' },
            }),
          };
        }
        return mockGeminiResponse('ok dari model fallback');
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }],
        }),
      };
    });

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Halo', model: 'gemini-2.5-flash' });

    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('ok dari model fallback');
    expect(res.body.data.model).toBe('gemini-3.8-flash');
  });

  it('POST /generate pindah model saat model utama overload (503)', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    let generateCalls = 0;
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes('generateContent')) {
        generateCalls += 1;
        if (generateCalls === 1) {
          return {
            ok: false,
            status: 503,
            json: async () => ({
              error: { code: 503, message: 'high demand', status: 'UNAVAILABLE' },
            }),
          };
        }
        return mockGeminiResponse('ok dari model cadangan');
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }],
        }),
      };
    });

    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Halo', model: 'gemini-2.5-flash' });

    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('ok dari model cadangan');
    expect(res.body.data.model).toBe('gemini-3.8-flash');
  });

  it('POST /chat sukses dengan riwayat pesan', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = jest.fn(async () => mockGeminiResponse('Baik, siap membantu'));

    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        messages: [
          { role: 'user', text: 'Halo' },
          { role: 'model', text: 'Hai' },
          { role: 'user', text: 'Bantu buat caption' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('Baik, siap membantu');
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(payload.contents).toHaveLength(3);
    expect(payload.contents[1].role).toBe('model');
  });

  it('POST /chat dengan messages kosong -> 400', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ messages: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /generate saat key belum diisi -> 503 AI_NOT_CONFIGURED', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Halo' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
  });

  it('generateStructured menolak JSON yang tidak sesuai skema', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = jest.fn(async () => mockGeminiResponse('{"judul": 123}'));

    const schema = z.object({ judul: z.string() });
    await expect(geminiService.generateStructured('Buat judul', schema)).rejects.toMatchObject({
      code: 'AI_INVALID_RESPONSE',
    });
  });

  it('generateJson mengembalikan json hasil parse', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    global.fetch = jest.fn(async () => mockGeminiResponse('{"ok":true}'));

    const result = await geminiService.generateJson('Buat status');
    expect(result.json).toEqual({ ok: true });
  });
});
