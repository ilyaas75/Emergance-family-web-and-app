const mongoose = require('mongoose');
const locationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true, index: true },
  geo: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } }, // [lng, lat]
  battery: { type: Number, min: 0, max: 100 },
  accuracy: { type: Number },
  speed: { type: Number, default: 0 },     // km/h
  heading: { type: Number },               // degrees
  moving: { type: Boolean, default: false },
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });
locationSchema.index({ geo: '2dsphere' });
module.exports = mongoose.model('Location', locationSchema);
