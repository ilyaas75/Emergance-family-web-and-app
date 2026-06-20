const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const { signAccessToken, generateRefreshToken, hashToken } = require('../utils/token');
const env = require('../config/env');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

async function issueTokens(user, ip) {
  const accessToken = signAccessToken(user);
  const { raw, hash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.jwtRefreshDays * 86400000);
  await RefreshToken.create({ user: user._id, tokenHash: hash, expiresAt, createdByIp: ip });
  return { accessToken, refreshToken: raw };
}

// POST /auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, phone, email, password, language } = req.body;
  if (await User.findOne({ phone })) throw new ApiError(409, 'auth.user_exists');
  const user = new User({ name, phone, email, language });
  await user.setPassword(password);
  await user.save();
  const tokens = await issueTokens(user, req.ip);
  return ok(req, res, { status: 201, msgKey: 'auth.registered', data: { user: user.toSafeJSON(), ...tokens } });
});

// POST /auth/login
exports.login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'auth.invalid_credentials');
  user.lastLogin = new Date();
  await user.save();
  const tokens = await issueTokens(user, req.ip);
  return ok(req, res, { msgKey: 'auth.login_success', data: { user: user.toSafeJSON(), ...tokens } });
});

// POST /auth/refresh  { refreshToken }  — rotates the refresh token.
exports.refresh = asyncHandler(async (req, res) => {
  const raw = req.body.refreshToken || req.cookies?.refreshToken;
  if (!raw) throw new ApiError(401, 'auth.invalid_token');
  const stored = await RefreshToken.findOne({ tokenHash: hashToken(raw) });
  if (!stored || !stored.isActive()) throw new ApiError(401, 'auth.invalid_token');
  const user = await User.findById(stored.user);
  if (!user || !user.isActive) throw new ApiError(401, 'auth.unauthorized');
  // rotate
  const { raw: newRaw, hash: newHash } = generateRefreshToken();
  stored.revoked = true; stored.replacedBy = newHash; await stored.save();
  await RefreshToken.create({ user: user._id, tokenHash: newHash, expiresAt: new Date(Date.now() + env.jwtRefreshDays * 86400000), createdByIp: req.ip });
  return ok(req, res, { msgKey: 'auth.token_refreshed', data: { accessToken: signAccessToken(user), refreshToken: newRaw } });
});

// POST /auth/logout  { refreshToken }
exports.logout = asyncHandler(async (req, res) => {
  const raw = req.body.refreshToken || req.cookies?.refreshToken;
  if (raw) await RefreshToken.updateOne({ tokenHash: hashToken(raw) }, { revoked: true });
  return ok(req, res, { msgKey: 'auth.logged_out' });
});

// GET /auth/me
exports.me = asyncHandler(async (req, res) => ok(req, res, { msgKey: 'generic.fetched', data: req.user.toSafeJSON() }));

// POST /auth/otp/request { phone } — generates a 6-digit code (dev: returned in response; prod: send via SMS).
exports.requestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone }).select('+otpHash +otpExpires');
  if (!user) throw new ApiError(404, 'generic.not_found');
  const code = ('' + Math.floor(100000 + Math.random() * 900000));
  user.otpHash = crypto.createHash('sha256').update(code).digest('hex');
  user.otpExpires = new Date(Date.now() + 5 * 60000);
  await user.save();
  const data = env.nodeEnv === 'development' ? { devCode: code } : null; // TODO: integrate SMS gateway
  return ok(req, res, { msgKey: 'auth.otp_sent', data });
});

// POST /auth/otp/verify { phone, code }
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { phone, code } = req.body;
  const user = await User.findOne({ phone }).select('+otpHash +otpExpires');
  if (!user || !user.otpHash || !user.otpExpires || user.otpExpires < new Date())
    throw new ApiError(400, 'auth.otp_invalid');
  if (crypto.createHash('sha256').update(code).digest('hex') !== user.otpHash)
    throw new ApiError(400, 'auth.otp_invalid');
  user.otpHash = undefined; user.otpExpires = undefined; user.phoneVerified = true; user.lastLogin = new Date();
  await user.save();
  const tokens = await issueTokens(user, req.ip);
  return ok(req, res, { msgKey: 'auth.login_success', data: { user: user.toSafeJSON(), ...tokens } });
});
