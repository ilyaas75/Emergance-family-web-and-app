const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpires });
}
function verifyAccessToken(token) { return jwt.verify(token, env.jwtAccessSecret); }
function generateRefreshToken() {
  const raw = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}
function hashToken(raw) { return crypto.createHash('sha256').update(raw).digest('hex'); }
module.exports = { signAccessToken, verifyAccessToken, generateRefreshToken, hashToken };
