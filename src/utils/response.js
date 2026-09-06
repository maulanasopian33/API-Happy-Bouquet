const logger = require('./logger');
const { ErrorCodes } = require('../constants/errors');

const successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    status: true,
    message,
    data,
    error: null,
  };
  return res.status(statusCode).json(response);
};

const errorResponse = (res, message, error = null, statusCode = 400) => {
  const response = {
    status: false,
    message,
    data: null,
    error,
  };
  logger.error(message, { error });
  return res.status(statusCode).json(response);
};

/**
 * Respons standar untuk kegagalan validasi Zod (Zod v4: pakai `.issues`, bukan `.errors`).
 */
const validationErrorResponse = (
  res,
  error,
  message = 'Validation error',
  statusCode = 400
) => {
  return errorResponse(res, message, { code: ErrorCodes.VALIDATION_ERROR, issues: error.issues || [] }, statusCode);
};

module.exports = { successResponse, errorResponse, validationErrorResponse };
