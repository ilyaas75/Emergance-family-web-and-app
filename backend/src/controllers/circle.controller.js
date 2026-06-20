const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const Circle = require('../models/Circle');

// POST /circles
exports.create = asyncHandler(async (req, res) => {
  const { name, type } = req.body;
  const circle = await Circle.create({
    name, type, owner: req.user._id,
    members: [{ user: req.user._id, role: 'admin' }],
  });
  return ok(req, res, { status: 201, msgKey: 'circle.created', data: circle });
});

// GET /circles/mine
exports.listMine = asyncHandler(async (req, res) => {
  const circles = await Circle.find({ 'members.user': req.user._id }).populate('members.user', 'name phone photo');
  return ok(req, res, { msgKey: 'generic.fetched', data: circles });
});

// GET /circles/:circleId  (member)
exports.getOne = asyncHandler(async (req, res) => {
  await req.circle.populate('members.user', 'name phone photo bloodType language');
  return ok(req, res, { msgKey: 'generic.fetched', data: req.circle });
});

// PUT /circles/:circleId  (admin)
exports.update = asyncHandler(async (req, res) => {
  ['name', 'type', 'settings'].forEach(k => { if (k in req.body) req.circle[k] = req.body[k]; });
  await req.circle.save();
  return ok(req, res, { msgKey: 'generic.updated', data: req.circle });
});

// DELETE /circles/:circleId  (owner only)
exports.remove = asyncHandler(async (req, res) => {
  if (req.circle.owner.toString() !== req.user._id.toString()) throw new ApiError(403, 'circle.not_admin');
  await req.circle.deleteOne();
  return ok(req, res, { msgKey: 'generic.deleted' });
});

// POST /circles/join  { inviteCode }
exports.join = asyncHandler(async (req, res) => {
  const circle = await Circle.findOne({ inviteCode: (req.body.inviteCode || '').toUpperCase() });
  if (!circle) throw new ApiError(400, 'circle.invalid_invite');
  if (circle.isMember(req.user._id)) throw new ApiError(409, 'circle.already_member');
  circle.members.push({ user: req.user._id, role: 'member' });
  await circle.save();
  return ok(req, res, { msgKey: 'circle.joined', data: circle });
});

// POST /circles/:circleId/leave
exports.leave = asyncHandler(async (req, res) => {
  req.circle.members = req.circle.members.filter(m => m.user.toString() !== req.user._id.toString());
  await req.circle.save();
  return ok(req, res, { msgKey: 'circle.left' });
});

// PUT /circles/:circleId/members/:userId  (admin) — change role
exports.setMemberRole = asyncHandler(async (req, res) => {
  const m = req.circle.members.find(x => x.user.toString() === req.params.userId);
  if (!m) throw new ApiError(404, 'circle.not_member');
  m.role = req.body.role === 'admin' ? 'admin' : 'member';
  await req.circle.save();
  return ok(req, res, { msgKey: 'generic.updated', data: req.circle });
});

// DELETE /circles/:circleId/members/:userId  (admin)
exports.removeMember = asyncHandler(async (req, res) => {
  req.circle.members = req.circle.members.filter(m => m.user.toString() !== req.params.userId);
  await req.circle.save();
  return ok(req, res, { msgKey: 'generic.deleted', data: req.circle });
});
