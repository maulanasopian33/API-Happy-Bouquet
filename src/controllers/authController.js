const logger = require('../utils/logger');
const authService = require('../services/authService');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const { AUTH_COOKIE_NAME, getAuthCookieOptions } = require('../middlewares/authMiddleware');
const userService = require('../services/userService');

const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.register(validatedData);
    logger.info(`User registered: ${user.email}`);
    return successResponse(res, 'User registered successfully', user, 201);
  } catch (error) {
    if (error.name === 'ZodError') {
      return validationErrorResponse(res, error, 'Validation error', 400);
    } else {
      return errorResponse(res, error.message, null, 400);
    }
  }
};

const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    logger.info(`User logged in: ${validatedData.email}`);
    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
    return successResponse(res, 'Login successful', result, 200);
  } catch (error) {
    return errorResponse(res, error.message, null, 401);
  }
};

const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized access', null, 401);
    }
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }
    return successResponse(res, 'Session verified successfully', user, 200);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

const logout = async (req, res) => {
  try {
    const { maxAge: _unused, ...clearOptions } = getAuthCookieOptions();
    res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
    return successResponse(res, 'Logged out successfully', null, 200);
  } catch (error) {
    return errorResponse(res, error.message, null, 500);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
