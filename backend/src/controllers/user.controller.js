const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const User = require('../models/User');

// GET /users/me
exports.getMe = asyncHandler(async (req, res) => ok(req, res, { msgKey: 'generic.fetched', data: req.user.toSafeJSON() }));

// PUT /users/me — profile + medical info + language
exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'email', 'photo', 'language', 'bloodType', 'allergies', 'conditions', 'medications', 'emergencyContacts'];
  for (const k of allowed) if (k in req.body) req.user[k] = req.body[k];
  await req.user.save();
  return ok(req, res, { msgKey: 'generic.updated', data: req.user.toSafeJSON() });
});

// PUT /users/me/password
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.comparePassword(currentPassword))) throw new ApiError(401, 'auth.invalid_credentials');
  await user.setPassword(newPassword);
  await user.save();
  return ok(req, res, { msgKey: 'auth.password_changed' });
});

// DELETE /users/me — soft delete
exports.deleteMe = asyncHandler(async (req, res) => {
  req.user.isActive = false;
  await req.user.save();
  return ok(req, res, { msgKey: 'generic.deleted' });
});

// GET /users  (system admin only)
exports.list = asyncHandler(async (req, res) => {
  const users = await User.find().limit(100);
  return ok(req, res, { msgKey: 'generic.fetched', data: users.map(u => u.toSafeJSON()) });
});
