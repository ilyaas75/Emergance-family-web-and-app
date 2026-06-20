const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const c = require('../controllers/user.controller');

router.use(protect);
router.get('/me', c.getMe);
router.put('/me', c.updateMe);
router.put('/me/password',
  body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 }),
  validate, c.updatePassword);
router.delete('/me', c.deleteMe);
router.get('/', authorize('admin'), c.list); // system admin only

module.exports = router;
