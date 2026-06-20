function ok(req, res, { status = 200, msgKey = 'generic.ok', data = null, meta } = {}) {
  return res.status(status).json({
    success: true,
    message: req.t ? req.t(msgKey) : msgKey,
    data,
    ...(meta ? { meta } : {}),
  });
}
module.exports = { ok };
