const ApiError = require('../utils/ApiError');
const env = require('../config/env');

function notFound(req, res, next) { next(new ApiError(404, 'generic.not_found')); }

function errorHandler(err, req, res, next) { // eslint-disable-line
  let statusCode = err.statusCode || 500;
  let msgKey = err.msgKey || 'generic.server_error';

  // Map common Mongoose / driver errors to clean responses.
  if (err.name === 'ValidationError') { statusCode = 422; msgKey = 'generic.validation_error'; }
  else if (err.name === 'CastError') { statusCode = 400; msgKey = 'generic.not_found'; }
  else if (err.code === 11000) { statusCode = 409; msgKey = 'auth.user_exists'; }
  else if (err.code === 'LIMIT_FILE_SIZE') { statusCode = 413; msgKey = 'upload.too_large'; }

  const message = req.t ? req.t(msgKey) : msgKey;
  if (statusCode >= 500) console.error('✗', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details ? { errors: err.details } : {}),
    ...(env.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
module.exports = { notFound, errorHandler };
