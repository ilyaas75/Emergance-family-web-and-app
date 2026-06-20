const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true, index: true },
  geo: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
  accuracy: { type: Number },
  speed: { type: Number, default: 0 },
  heading: { type: Number },
  moving: { type: Boolean, default: false },
  recordedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

locationHistorySchema.index({ geo: '2dsphere' });
locationHistorySchema.index({ circle: 1, user: 1, recordedAt: -1 });

module.exports = mongoose.model('LocationHistory', locationHistorySchema);
