const mongoose = require('mongoose');
const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  createdByIp: { type: String },
  replacedBy: { type: String },
}, { timestamps: true });
refreshTokenSchema.methods.isActive = function () { return !this.revoked && this.expiresAt > new Date(); };
module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
