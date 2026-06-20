const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const User = require('../models/User');
const Circle = require('../models/Circle');
const Alert = require('../models/Alert');
const Location = require('../models/Location');

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days) {
  return new Date(Date.now() - days * DAY_MS);
}

function csv(res, filename, rows) {
  const keys = Object.keys(rows[0] || { id: '', name: '', value: '' });
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const body = [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  return res.send(body);
}

exports.overview = asyncHandler(async (req, res) => {
  const [users, activeUsers, circles, activeAlerts, totalAlerts, resolvedAlerts, locations, recentAlerts] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Circle.countDocuments(),
    Alert.countDocuments({ status: 'active' }),
    Alert.countDocuments(),
    Alert.countDocuments({ status: 'resolved' }),
    Location.countDocuments(),
    Alert.find().sort('-startedAt').limit(8).populate('triggeredBy', 'name phone').populate('circle', 'name type'),
  ]);

  const alertStats = await Alert.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const userStats = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);
  const weeklyAlerts = await Alert.aggregate([
    { $match: { startedAt: { $gte: daysAgo(7) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return ok(req, res, {
    msgKey: 'generic.fetched',
    data: {
      totals: { users, activeUsers, circles, activeAlerts, totalAlerts, resolvedAlerts, locations },
      alertStats,
      userStats,
      weeklyAlerts,
      recentAlerts,
    },
  });
});

exports.users = asyncHandler(async (req, res) => {
  const users = await User.find().sort('-createdAt').limit(300);
  return ok(req, res, { msgKey: 'generic.fetched', data: users.map((u) => u.toSafeJSON()) });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new ApiError(404, 'generic.not_found');
  if ('role' in req.body) user.role = req.body.role === 'admin' ? 'admin' : 'member';
  if ('isActive' in req.body) user.isActive = !!req.body.isActive;
  await user.save();
  return ok(req, res, { msgKey: 'generic.updated', data: user.toSafeJSON() });
});

exports.circles = asyncHandler(async (req, res) => {
  const circles = await Circle.find().sort('-createdAt').populate('owner', 'name phone').populate('members.user', 'name phone role');
  return ok(req, res, { msgKey: 'generic.fetched', data: circles });
});

exports.alerts = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.status) q.status = req.query.status;
  const alerts = await Alert.find(q).sort('-startedAt').limit(300)
    .populate('triggeredBy', 'name phone')
    .populate('circle', 'name type');
  return ok(req, res, { msgKey: 'generic.fetched', data: alerts });
});

exports.updateAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.alertId);
  if (!alert) throw new ApiError(404, 'generic.not_found');
  if (['active', 'resolved', 'cancelled'].includes(req.body.status)) {
    alert.status = req.body.status;
    if (alert.status !== 'active') alert.resolvedAt = new Date();
  }
  await alert.save();
  return ok(req, res, { msgKey: 'generic.updated', data: alert });
});

exports.locations = asyncHandler(async (req, res) => {
  const locations = await Location.find().sort('-recordedAt').limit(500).populate('user', 'name phone').populate('circle', 'name type');
  return ok(req, res, { msgKey: 'generic.fetched', data: locations });
});

exports.contacts = asyncHandler(async (req, res) => {
  const users = await User.find({ 'emergencyContacts.0': { $exists: true } }).select('name phone emergencyContacts');
  const contacts = users.flatMap((user) => user.emergencyContacts.map((contact) => ({
    user: { _id: user._id, name: user.name, phone: user.phone },
    name: contact.name,
    phone: contact.phone,
    relation: contact.relation,
  })));
  return ok(req, res, { msgKey: 'generic.fetched', data: contacts });
});

exports.reports = asyncHandler(async (req, res) => {
  const [incidents, calls, locationReports] = await Promise.all([
    Alert.find().sort('-startedAt').limit(100).populate('triggeredBy', 'name phone').populate('circle', 'name'),
    Alert.find({ 'smsBackups.0': { $exists: true } }).sort('-startedAt').limit(100).populate('triggeredBy', 'name phone'),
    Location.find().sort('-recordedAt').limit(100).populate('user', 'name phone').populate('circle', 'name'),
  ]);
  return ok(req, res, { msgKey: 'generic.fetched', data: { incidents, calls, locations: locationReports } });
});

exports.activityLogs = asyncHandler(async (req, res) => {
  const [alerts, users, locations] = await Promise.all([
    Alert.find().sort('-updatedAt').limit(30).populate('triggeredBy', 'name phone'),
    User.find().sort('-updatedAt').limit(30),
    Location.find().sort('-updatedAt').limit(30).populate('user', 'name phone'),
  ]);
  const logs = [
    ...alerts.map((a) => ({ type: 'alert', message: `${a.triggeredBy?.name || 'User'} alert is ${a.status}`, at: a.updatedAt })),
    ...users.map((u) => ({ type: 'user', message: `${u.name} account updated`, at: u.updatedAt })),
    ...locations.map((l) => ({ type: 'location', message: `${l.user?.name || 'User'} shared GPS location`, at: l.updatedAt })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 80);
  return ok(req, res, { msgKey: 'generic.fetched', data: logs });
});

exports.settings = asyncHandler(async (req, res) => ok(req, res, {
  msgKey: 'generic.fetched',
  data: {
    locationTracking: true,
    pushNotifications: true,
    smsBackup: true,
    auditLogs: true,
    exports: ['csv'],
    roles: ['admin', 'member'],
  },
}));

exports.exportData = asyncHandler(async (req, res) => {
  const type = req.params.type;
  if (type === 'users') {
    const users = await User.find().sort('-createdAt');
    return csv(res, 'users', users.map((u) => ({ id: u._id, name: u.name, phone: u.phone, role: u.role, active: u.isActive })));
  }
  if (type === 'alerts') {
    const alerts = await Alert.find().sort('-startedAt').populate('triggeredBy', 'name phone').populate('circle', 'name');
    return csv(res, 'alerts', alerts.map((a) => ({ id: a._id, user: a.triggeredBy?.name, circle: a.circle?.name, status: a.status, startedAt: a.startedAt, resolvedAt: a.resolvedAt })));
  }
  if (type === 'locations') {
    const locations = await Location.find().sort('-recordedAt').populate('user', 'name phone').populate('circle', 'name');
    return csv(res, 'locations', locations.map((l) => ({ id: l._id, user: l.user?.name, circle: l.circle?.name, lat: l.geo.coordinates[1], lng: l.geo.coordinates[0], accuracy: l.accuracy, speed: l.speed, recordedAt: l.recordedAt })));
  }
  throw new ApiError(404, 'generic.not_found');
});
