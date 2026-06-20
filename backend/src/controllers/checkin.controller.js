const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const Checkin = require('../models/Checkin');
const { emitToCircle } = require('../realtime/socket');

// POST /circles/:circleId/checkins
exports.create = asyncHandler(async (req, res) => {
  const checkin = await Checkin.create({ circle: req.circle._id, requestedBy: req.user._id, prompt: req.body.prompt });
  emitToCircle(req.circle._id.toString(), 'checkin:new', { checkinId: checkin._id, by: req.user.name, prompt: checkin.prompt });
  return ok(req, res, { status: 201, msgKey: 'checkin.created', data: checkin });
});

// GET /circles/:circleId/checkins
exports.list = asyncHandler(async (req, res) => {
  const list = await Checkin.find({ circle: req.circle._id }).sort('-createdAt').populate('requestedBy', 'name');
  return ok(req, res, { msgKey: 'generic.fetched', data: list });
});

// POST /circles/:circleId/checkins/:checkinId/respond { status: safe|help }
exports.respond = asyncHandler(async (req, res) => {
  const checkin = await Checkin.findOne({ _id: req.params.checkinId, circle: req.circle._id });
  if (!checkin) throw new ApiError(404, 'generic.not_found');
  const existing = checkin.responses.find(r => r.user.toString() === req.user._id.toString());
  if (existing) existing.status = req.body.status;
  else checkin.responses.push({ user: req.user._id, status: req.body.status });
  await checkin.save();
  emitToCircle(req.circle._id.toString(), 'checkin:update', { checkinId: checkin._id, user: req.user.name, status: req.body.status });
  return ok(req, res, { msgKey: 'checkin.responded', data: checkin });
});
