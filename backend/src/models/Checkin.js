const mongoose = require('mongoose');
const checkinSchema = new mongoose.Schema({
  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prompt: { type: String, default: 'Ma nabad baa?' },
  responses: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['safe', 'help'], required: true },
    at: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });
module.exports = mongoose.model('Checkin', checkinSchema);
