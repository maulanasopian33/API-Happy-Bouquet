const geminiService = require('../services/geminiService');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { generateSchema, chatSchema } = require('../validators/aiValidator');

const getStatus = async (_req, res, next) => {
  try {
    return successResponse(res, 'Status integrasi AI', {
      configured: geminiService.isConfigured(),
      model: geminiService.getModel(),
      models: await geminiService.listModels(),
    });
  } catch (error) {
    next(error);
  }
};

const generate = async (req, res, next) => {
  try {
    const { prompt, json, ...options } = generateSchema.parse(req.body);
    const result = json
      ? await geminiService.generateJson(prompt, options)
      : await geminiService.generateText(prompt, options);

    logger.info(`Admin ${req.user?.id} memanggil AI generate (model=${result.model}, ${result.usage.totalTokens} tokens)`);
    return successResponse(res, 'Respons AI berhasil dibuat', result);
  } catch (error) {
    next(error);
  }
};

const chat = async (req, res, next) => {
  try {
    const { messages, ...options } = chatSchema.parse(req.body);
    const result = await geminiService.chat(messages, options);

    logger.info(`Admin ${req.user?.id} memanggil AI chat (${messages.length} pesan, ${result.usage.totalTokens} tokens)`);
    return successResponse(res, 'Respons AI berhasil dibuat', result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getStatus, generate, chat };
