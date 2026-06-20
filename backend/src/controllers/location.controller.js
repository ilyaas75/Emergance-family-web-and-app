const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/ApiResponse');
const Location = require('../models/Location');
const LocationHistory = require('../models/LocationHistory');
const { emitToCircle } = require('../realtime/socket');

// POST /circles/:circleId/location  — device pushes its current location.
exports.update = asyncHandler(async (req, res) => {
  const { lng, lat, battery, accuracy, speed, heading, moving } = req.body;
  const doc = await Location.findOneAndUpdate(
    { user: req.user._id, circle: req.circle._id },
    { geo: { type: 'Point', coordinates: [lng, lat] }, battery, accuracy, speed, heading, moving, recordedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await LocationHistory.create({
    user: req.user._id,
    circle: req.circle._id,
    geo: { type: 'Point', coordinates: [lng, lat] },
    accuracy,
    speed,
    heading,
    moving,
    recordedAt: doc.recordedAt,
  });
  // broadcast live to everyone in the circle room
  emitToCircle(req.circle._id.toString(), 'location:update', {
    user: req.user._id, name: req.user.name, lng, lat, battery, accuracy, speed, heading, moving, at: doc.recordedAt,
  });
  return ok(req, res, { msgKey: 'location.updated', data: doc });
});

// GET /circles/:circleId/locations  — latest location of each member.
exports.listForCircle = asyncHandler(async (req, res) => {
  const locs = await Location.find({ circle: req.circle._id }).populate('user', 'name phone photo');
  return ok(req, res, { msgKey: 'generic.fetched', data: locs });
});

// GET /circles/:circleId/locations/history?userId=...&limit=100
exports.history = asyncHandler(async (req, res) => {
  const q = { circle: req.circle._id };
  if (req.query.userId) q.user = req.query.userId;
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
  const history = await LocationHistory.find(q).sort('-recordedAt').limit(limit).populate('user', 'name phone photo');
  return ok(req, res, { msgKey: 'generic.fetched', data: history });
});

// GET /circles/:circleId/locations/activity
exports.activity = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const latest = await Location.find({ circle: req.circle._id }).populate('user', 'name phone photo');
  const histories = await LocationHistory.find({ circle: req.circle._id, recordedAt: { $gte: since } })
    .sort('-recordedAt')
    .populate('user', 'name phone photo');

  const byUser = new Map();
  histories.forEach((point) => {
    const id = point.user?._id?.toString() || point.user.toString();
    if (!byUser.has(id)) byUser.set(id, []);
    byUser.get(id).push(point);
  });

  const data = latest.map((loc) => {
    const id = loc.user?._id?.toString() || loc.user.toString();
    const points = byUser.get(id) || [];
    const visited = points.slice(0, 8).map((p) => ({
      lat: p.geo.coordinates[1],
      lng: p.geo.coordinates[0],
      accuracy: p.accuracy,
      speed: p.speed,
      heading: p.heading,
      moving: p.moving,
      recordedAt: p.recordedAt,
    }));
    return {
      user: loc.user,
      current: {
        lat: loc.geo.coordinates[1],
        lng: loc.geo.coordinates[0],
        accuracy: loc.accuracy,
        speed: loc.speed,
        heading: loc.heading,
        moving: loc.moving,
        recordedAt: loc.recordedAt,
      },
      summary: {
        points24h: points.length,
        movingPoints24h: points.filter((p) => p.moving).length,
        lastSeen: loc.recordedAt,
        direction: loc.heading,
        going: loc.moving ? 'moving' : 'stationary',
      },
      visited,
    };
  });
  return ok(req, res, { msgKey: 'generic.fetched', data });
});
