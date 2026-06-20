const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/auth.controller');

router.post('/register',
  body('name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('password').isLength({ min: 6 }),
  body('language').optional().isIn(['so', 'ar', 'en']),
  validate, c.register);

router.post('/login',
  body('phone').trim().notEmpty(),
  body('password').notEmpty(),
  validate, c.login);

router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.get('/me', protect, c.me);

router.post('/otp/request', body('phone').trim().notEmpty(), validate, c.requestOtp);
router.post('/otp/verify', body('phone').trim().notEmpty(), body('code').isLength({ min: 6, max: 6 }), validate, c.verifyOtp);

module.exports = router;
