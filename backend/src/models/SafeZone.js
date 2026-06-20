const mongoose = require('mongoose');
const safeZoneSchema = new mongoose.Schema({
  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true, index: true },
  name: { type: String, required: true, trim: true },
  center: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
  radius: { type: Number, default: 150 }, // meters
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notifyOn: { type: [String], enum: ['enter', 'exit'], default: ['enter', 'exit'] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
safeZoneSchema.index({ center: '2dsphere' });
module.exports = mongoose.model('SafeZone', safeZoneSchema);
