const { AppError, ErrorCodes } = require('../constants/errors');
const logger = require('../utils/logger');

const DEFAULT_MODEL = 'gemini-3.8-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELS_TTL_MS = 10 * 60 * 1000;

let modelCache = { at: 0, models: [] };

// Env dibaca saat dipanggil agar mudah di-mock/di-set (test & runtime).
const getConfig = () => ({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
});

const isConfigured = () => Boolean(getConfig().apiKey);

const getModel = () => getConfig().model;

// Daftar model diambil dari Gemini (bukan hardcode) supaya tidak basi saat Google deprecate model.
const listModels = async () => {
  const { apiKey } = getConfig();
  if (!apiKey) return [];

  if (Date.now() - modelCache.at < MODELS_TTL_MS) return modelCache.models;

  try {
    const response = await fetch(`${API_BASE}?pageSize=100`, {
      headers: { 'x-goog-api-key': apiKey },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      logger.warn(`Gagal mengambil daftar model Gemini: ${data?.error?.message || response.status}`);
      return modelCache.models;
    }

    const models = (data.models || [])
      .filter((model) => (model.supportedGenerationMethods || []).includes('generateContent'))
      .map((model) => String(model.name || '').replace(/^models\//, ''))
      .filter(Boolean);

    modelCache = { at: Date.now(), models };
    return models;
  } catch (error) {
    logger.warn(`Gagal menghubungi Gemini untuk daftar model: ${error.message}`);
    return modelCache.models;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildContents = (messages) =>
  messages.map((message) => ({
    role: message.role === 'model' || message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(message.text ?? message.content ?? '') }],
  }));

const buildPayload = ({ contents, systemInstruction, temperature, maxOutputTokens, json }) => {
  const payload = { contents };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const generationConfig = {};
  if (typeof temperature === 'number') generationConfig.temperature = temperature;
  if (typeof maxOutputTokens === 'number') generationConfig.maxOutputTokens = maxOutputTokens;
  if (json) generationConfig.responseMimeType = 'application/json';
  if (Object.keys(generationConfig).length > 0) payload.generationConfig = generationConfig;

  return payload;
};

// Model flash punya "thinking" yang membuat respons bisa sangat lambat (kerap >60s dan kena timeout proxy hosting).
const withThinkingOff = (payload, model) => {
  if (!/flash/i.test(model)) return payload;
  return {
    ...payload,
    generationConfig: { ...(payload.generationConfig || {}), thinkingConfig: { thinkingBudget: 0 } },
  };
};

const callGemini = async (payload, { timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) || 40000, model: requestedModel } = {}) => {
  const { apiKey, model: defaultModel } = getConfig();
  const model = requestedModel || defaultModel;

  if (!apiKey) {
    throw new AppError(
      'Integrasi AI belum dikonfigurasi. Isi GEMINI_API_KEY di environment.',
      503,
      ErrorCodes.AI_NOT_CONFIGURED
    );
  }

  const startedAt = Date.now();
  let activeModel = model;
  let modelFallbackUsed = false;
  let body = withThinkingOff(payload, activeModel);
  let thinkingDisabled = /flash/i.test(activeModel);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const url = `${API_BASE}/${encodeURIComponent(activeModel)}:generateContent`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const upstreamMessage = data?.error?.message || `Gemini HTTP ${response.status}`;

        // Sebagian model menolak thinkingConfig -> ulangi tanpa itu.
        if (response.status === 400 && thinkingDisabled && /thinking/i.test(upstreamMessage)) {
          thinkingDisabled = false;
          body = payload;
          logger.warn('Model menolak thinkingConfig, mengulang tanpa thinking.');
          continue;
        }

        // Model bisa di-deprecate kapan saja (mis. gemini-2.5-flash) -> pindah sekali ke model tersedia.
        if (response.status === 404 && !modelFallbackUsed) {
          const available = await listModels();
          const nextModel = available.find((item) => item !== activeModel);

          if (nextModel) {
            modelFallbackUsed = true;
            logger.warn(`Model ${activeModel} tidak tersedia, fallback ke ${nextModel}`);
            activeModel = nextModel;
            body = withThinkingOff(payload, activeModel);
            thinkingDisabled = /flash/i.test(activeModel);
            continue;
          }
        }

        const retryable = response.status === 429 || response.status >= 500;

        if (retryable && attempt === 1) {
          logger.warn(`Gemini upstream ${response.status}, retrying once...`);
          await sleep(500);
          continue;
        }

        logger.error(`Gemini upstream error: ${upstreamMessage}`);
        throw new AppError('Permintaan ke AI gagal.', 502, ErrorCodes.AI_UPSTREAM_ERROR, {
          upstreamStatus: response.status,
          upstreamMessage,
        });
      }

      if (data?.promptFeedback?.blockReason) {
        throw new AppError('Prompt diblokir oleh filter keamanan AI.', 422, ErrorCodes.AI_BLOCKED, {
          blockReason: data.promptFeedback.blockReason,
        });
      }

      const candidate = data?.candidates?.[0];
      const text = (candidate?.content?.parts || [])
        .map((part) => part.text)
        .filter(Boolean)
        .join('')
        .trim();

      if (!text) {
        throw new AppError('AI tidak mengembalikan teks.', 502, ErrorCodes.AI_INVALID_RESPONSE);
      }

      const usage = data?.usageMetadata || {};
      return {
        text,
        model: activeModel,
        finishReason: candidate?.finishReason || null,
        usage: {
          promptTokens: usage.promptTokenCount || 0,
          candidateTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0,
        },
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'AbortError') {
        throw new AppError('Permintaan ke AI melebihi batas waktu.', 504, ErrorCodes.AI_UPSTREAM_ERROR, {
          timeoutMs,
        });
      }
      logger.error('Gemini request failed:', error);
      throw new AppError('Gagal menghubungi layanan AI.', 502, ErrorCodes.AI_UPSTREAM_ERROR, {
        cause: error.message,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  throw new AppError('Permintaan ke AI gagal.', 502, ErrorCodes.AI_UPSTREAM_ERROR);
};

const stripCodeFence = (text) =>
  text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

const generateText = async (prompt, options = {}) => {
  if (!prompt || typeof prompt !== 'string') {
    throw new AppError('Prompt wajib berupa teks.', 400, ErrorCodes.VALIDATION_ERROR);
  }

  return callGemini(
    buildPayload({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: options.systemInstruction,
      temperature: options.temperature,
      maxOutputTokens: options.maxOutputTokens,
      json: options.json,
    }),
    options
  );
};

const generateJson = async (prompt, options = {}) => {
  const result = await generateText(prompt, { ...options, json: true });

  try {
    return { ...result, json: JSON.parse(stripCodeFence(result.text)) };
  } catch (error) {
    logger.error('Gemini mengembalikan JSON tidak valid:', result.text);
    throw new AppError('AI mengembalikan JSON yang tidak valid.', 502, ErrorCodes.AI_INVALID_RESPONSE);
  }
};

const generateStructured = async (prompt, schema, options = {}) => {
  const result = await generateJson(prompt, options);

  try {
    return { ...result, data: schema.parse(result.json) };
  } catch (error) {
    throw new AppError('Struktur JSON dari AI tidak sesuai skema.', 502, ErrorCodes.AI_INVALID_RESPONSE, {
      issues: error.issues || null,
    });
  }
};

const chat = async (messages, options = {}) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError('Messages wajib berupa array dan tidak boleh kosong.', 400, ErrorCodes.VALIDATION_ERROR);
  }

  return callGemini(
    buildPayload({
      contents: buildContents(messages),
      systemInstruction: options.systemInstruction,
      temperature: options.temperature,
      maxOutputTokens: options.maxOutputTokens,
      json: options.json,
    }),
    options
  );
};

module.exports = {
  DEFAULT_MODEL,
  isConfigured,
  getModel,
  listModels,
  generateText,
  generateJson,
  generateStructured,
  chat,
};
