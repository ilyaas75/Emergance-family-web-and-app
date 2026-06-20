const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const Alert = require('../models/Alert');
const { emitToCircle } = require('../realtime/socket');

function uniqueContacts(contacts) {
  const seen = new Set();
  return contacts.filter((contact) => {
    const phone = (contact.phone || '').trim();
    if (!phone || seen.has(phone)) return false;
    seen.add(phone);
    return true;
  });
}

function locationUrl(lng, lat) {
  return lng != null && lat != null ? `https://maps.google.com/?q=${lat},${lng}` : '';
}

function buildEmergencyMessage(user, note, url) {
  const message = note || `${user.name} sent an emergency SOS alert. Please check immediately.`;
  return url ? `${message} Location: ${url}` : message;
}

// POST /circles/:circleId/alerts  — trigger an SOS.
exports.create = asyncHandler(async (req, res) => {
  const { lng, lat, note, type } = req.body;
  await req.circle.populate('members.user', 'name phone');
  const url = locationUrl(lng, lat);
  const emergencyMessage = buildEmergencyMessage(req.user, note, url);
  const circleContacts = req.circle.members
    .filter((m) => m.user && m.user._id.toString() !== req.user._id.toString())
    .map((m) => ({ name: m.user.name, phone: m.user.phone }));
  const profileContacts = (req.user.emergencyContacts || []).map((c) => ({ name: c.name, phone: c.phone }));
  const smsBackups = uniqueContacts([...circleContacts, ...profileContacts]).map((contact) => ({
    ...contact,
    status: 'queued',
  }));
  const alert = await Alert.create({
    circle: req.circle._id, triggeredBy: req.user._id, type: type || 'sos', note, emergencyMessage,
    locationUrl: url || undefined,
    smsBackups,
    location: (lng != null && lat != null) ? { type: 'Point', coordinates: [lng, lat] } : undefined,
  });
  if (smsBackups.length) {
    console.log(`[sms-backup] SOS ${alert._id}: queued ${smsBackups.length} SMS messages`);
  }
  emitToCircle(req.circle._id.toString(), 'alert:new', {
    alertId: alert._id,
    by: req.user.name,
    byId: req.user._id,
    type: alert.type,
    message: emergencyMessage,
    locationUrl: alert.locationUrl,
    smsBackups: smsBackups.length,
    lng,
    lat,
    at: alert.startedAt,
  });
  return ok(req, res, { status: 201, msgKey: 'alert.created', data: alert });
});

// GET /circles/:circleId/alerts?status=active|resolved|cancelled
exports.list = asyncHandler(async (req, res) => {
  const q = { circle: req.circle._id };
  if (req.query.status) q.status = req.query.status;
  const alerts = await Alert.find(q).sort('-startedAt').populate('triggeredBy', 'name photo');
  return ok(req, res, { msgKey: 'generic.fetched', data: alerts });
});

// GET /circles/:circleId/alerts/:alertId
exports.getOne = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.alertId, circle: req.circle._id })
    .populate('triggeredBy', 'name photo bloodType allergies').populate('responders.user', 'name photo');
  if (!alert) throw new ApiError(404, 'generic.not_found');
  return ok(req, res, { msgKey: 'generic.fetched', data: alert });
});

// POST /circles/:circleId/alerts/:alertId/respond  { status }
exports.respond = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.alertId, circle: req.circle._id });
  if (!alert) throw new ApiError(404, 'generic.not_found');
  if (alert.status !== 'active') throw new ApiError(400, 'alert.not_active');
  const existing = alert.responders.find(r => r.user.toString() === req.user._id.toString());
  if (existing) existing.status = req.body.status || 'responding';
  else alert.responders.push({ user: req.user._id, status: req.body.status || 'responding' });
  await alert.save();
  emitToCircle(req.circle._id.toString(), 'alert:update', { alertId: alert._id, responder: req.user.name, status: req.body.status });
  return ok(req, res, { msgKey: 'alert.responded', data: alert });
});

// POST /circles/:circleId/alerts/:alertId/resolve  (status: resolved|cancelled)
exports.resolve = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.alertId, circle: req.circle._id });
  if (!alert) throw new ApiError(404, 'generic.not_found');
  alert.status = req.body.cancel ? 'cancelled' : 'resolved';
  alert.resolvedAt = new Date();
  await alert.save();
  emitToCircle(req.circle._id.toString(), 'alert:update', { alertId: alert._id, status: alert.status });
  return ok(req, res, { msgKey: alert.status === 'cancelled' ? 'alert.cancelled' : 'alert.resolved', data: alert });
});

// POST /circles/:circleId/alerts/:alertId/media  (multipart: file=recording) — audio/video evidence.
exports.uploadMedia = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({ _id: req.params.alertId, circle: req.circle._id });
  if (!alert) throw new ApiError(404, 'generic.not_found');
  if (!req.file) throw new ApiError(422, 'generic.validation_error');
  const kind = req.file.mimetype.startsWith('video') ? 'video' : 'audio';
  alert.media.push({ kind, url: `/uploads/${req.file.filename}`, size: req.file.size, durationSec: req.body.durationSec });
  await alert.save();
  emitToCircle(req.circle._id.toString(), 'alert:update', { alertId: alert._id, media: kind });
  return ok(req, res, { status: 201, msgKey: 'alert.media_uploaded', data: alert.media[alert.media.length - 1] });
});
