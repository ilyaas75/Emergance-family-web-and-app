const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
// Runs after express-validator chains; collects errors.
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const err = new ApiError(422, 'generic.validation_error');
  err.details = errors.array().map(e => ({ field: e.path, msg: e.msg }));
  next(err);
};
