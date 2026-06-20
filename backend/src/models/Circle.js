const mongoose = require('mongoose');
const crypto = require('crypto');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' }, // role WITHIN this circle
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const circleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  type: { type: String, enum: ['couple', 'family'], default: 'family' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inviteCode: { type: String, unique: true, index: true },
  members: [memberSchema],
  settings: {
    shareLocation: { type: Boolean, default: true },
    notifyOnSos: { type: Boolean, default: true },
  },
}, { timestamps: true });

circleSchema.pre('validate', function (next) {
  if (!this.inviteCode) this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  next();
});
circleSchema.methods.memberRole = function (userId) {
  const m = this.members.find(x => x.user.toString() === userId.toString());
  return m ? m.role : null;
};
circleSchema.methods.isMember = function (userId) { return !!this.memberRole(userId); };

module.exports = mongoose.model('Circle', circleSchema);
