const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const Circle = require('../models/Circle');

// System-level role gate, e.g. authorize('admin').
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, 'auth.forbidden'));
  next();
};

// Resource-level: requires the caller to be a member of the circle
// identified by req.params.circleId (or body.circle). Attaches req.circle + req.memberRole.
const circleMember = asyncHandler(async (req, res, next) => {
  const circleId = req.params.circleId || req.body.circle;
  const circle = await Circle.findById(circleId);
  if (!circle) throw new ApiError(404, 'generic.not_found');
  const role = circle.memberRole(req.user._id);
  if (!role) throw new ApiError(403, 'circle.not_member');
  req.circle = circle;
  req.memberRole = role;
  next();
});

// Must be admin within that circle (run after circleMember).
const circleAdmin = (req, res, next) => {
  if (req.memberRole !== 'admin') return next(new ApiError(403, 'circle.not_admin'));
  next();
};
module.exports = { authorize, circleMember, circleAdmin };
