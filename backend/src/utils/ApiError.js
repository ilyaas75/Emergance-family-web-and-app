// Operational error carrying an HTTP status and an i18n message key.
class ApiError extends Error {
  constructor(statusCode, msgKey, params = {}) {
    super(msgKey);
    this.statusCode = statusCode;
    this.msgKey = msgKey;
    this.params = params;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = ApiError;
