const mongoose = require('mongoose');
const mediaSchema = new mongoose.Schema({
  kind: { type: String, enum: ['audio', 'video'], required: true },
  url: { type: String, required: true },
  size: { type: Number },
  durationSec: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const responderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['responding', 'arrived', 'safe', 'help'], default: 'responding' },
  at: { type: Date, default: Date.now },
}, { _id: false });

const smsBackupSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, required: true, trim: true },
  status: { type: String, enum: ['queued', 'sent', 'failed', 'skipped'], default: 'queued' },
  error: { type: String, trim: true },
  at: { type: Date, default: Date.now },
}, { _id: false });

const alertSchema = new mongoose.Schema({
  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true, index: true },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['sos', 'checkin'], default: 'sos' },
  status: { type: String, enum: ['active', 'resolved', 'cancelled'], default: 'active', index: true },
  note: { type: String, trim: true },
  emergencyMessage: { type: String, trim: true },
  locationUrl: { type: String, trim: true },
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number] } },
  media: [mediaSchema],
  responders: [responderSchema],
  smsBackups: [smsBackupSchema],
  startedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
}, { timestamps: true });
alertSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Alert', alertSchema);
