const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  relation: { type: String, trim: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true, sparse: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'member'], default: 'member' }, // system-level role
  photo: { type: String },
  language: { type: String, enum: ['so', 'ar', 'en'], default: env.defaultLang },
  // medical info surfaced to circle members during emergencies
  bloodType: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-',''], default: '' },
  allergies: { type: String, trim: true, default: '' },
  conditions: { type: String, trim: true, default: '' },
  medications: { type: String, trim: true, default: '' },
  emergencyContacts: [emergencyContactSchema],
  // phone OTP verification (alternative auth)
  otpHash: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  phoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, env.bcryptRounds);
};
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.methods.toSafeJSON = function () {
  const o = this.toObject();
  delete o.passwordHash; delete o.otpHash; delete o.otpExpires; delete o.__v;
  return o;
};

module.exports = mongoose.model('User', userSchema);
