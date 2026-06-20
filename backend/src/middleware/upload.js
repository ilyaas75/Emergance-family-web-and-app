const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('audio') ? '.m4a' : '.mp4');
    cb(null, `alert-${req.params.alertId || 'na'}-${Date.now()}${ext}`);
  },
});
// Only audio / video recordings are accepted (emergency evidence).
function fileFilter(req, file, cb) {
  if (/^audio\//.test(file.mimetype) || /^video\//.test(file.mimetype)) return cb(null, true);
  cb(new ApiError(415, 'upload.invalid_type'));
}
const upload = multer({ storage, fileFilter, limits: { fileSize: env.maxUploadMb * 1024 * 1024 } });
module.exports = { upload, UPLOAD_DIR };
