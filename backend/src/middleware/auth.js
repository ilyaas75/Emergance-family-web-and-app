const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

// Verifies the access token and attaches req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'auth.unauthorized');
  let payload;
  try { payload = verifyAccessToken(token); }
  catch (e) { throw new ApiError(401, 'auth.invalid_token'); }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'auth.unauthorized');
  req.user = user;
  next();
});
module.exports = { protect };
