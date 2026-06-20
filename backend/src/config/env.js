require('dotenv').config();
const defaultClientOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost',
  'http://127.0.0.1',
];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/badbaado',
  clientOrigins: (process.env.CLIENT_ORIGINS || defaultClientOrigins.join(',')).split(',').map(s => s.trim()),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshDays: parseInt(process.env.JWT_REFRESH_DAYS || '30', 10),
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  defaultLang: process.env.DEFAULT_LANG || 'so',
  maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || '50', 10),
};
module.exports = env;
