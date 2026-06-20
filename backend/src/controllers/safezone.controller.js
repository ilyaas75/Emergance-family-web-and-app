const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const SafeZone = require('../models/SafeZone');

// Full CRUD, scoped to a circle.
exports.create = asyncHandler(async (req, res) => {
  const { name, lng, lat, radius, members, notifyOn } = req.body;
  const zone = await SafeZone.create({
    circle: req.circle._id, name, radius, members, notifyOn,
    center: { type: 'Point', coordinates: [lng, lat] }, createdBy: req.user._id,
  });
  return ok(req, res, { status: 201, msgKey: 'generic.created', data: zone });
});
exports.list = asyncHandler(async (req, res) => {
  const zones = await SafeZone.find({ circle: req.circle._id });
  return ok(req, res, { msgKey: 'generic.fetched', data: zones });
});
exports.update = asyncHandler(async (req, res) => {
  const zone = await SafeZone.findOne({ _id: req.params.zoneId, circle: req.circle._id });
  if (!zone) throw new ApiError(404, 'generic.not_found');
  ['name', 'radius', 'members', 'notifyOn'].forEach(k => { if (k in req.body) zone[k] = req.body[k]; });
  if (req.body.lng != null && req.body.lat != null) zone.center = { type: 'Point', coordinates: [req.body.lng, req.body.lat] };
  await zone.save();
  return ok(req, res, { msgKey: 'generic.updated', data: zone });
});
exports.remove = asyncHandler(async (req, res) => {
  const zone = await SafeZone.findOneAndDelete({ _id: req.params.zoneId, circle: req.circle._id });
  if (!zone) throw new ApiError(404, 'generic.not_found');
  return ok(req, res, { msgKey: 'generic.deleted' });
});
