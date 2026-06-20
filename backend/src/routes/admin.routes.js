const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const c = require('../controllers/admin.controller');

router.use(protect, authorize('admin'));

router.get('/overview', c.overview);
router.get('/users', c.users);
router.patch('/users/:userId',
  body('role').optional().isIn(['admin', 'member']),
  body('isActive').optional().isBoolean(),
  validate,
  c.updateUser);
router.get('/circles', c.circles);
router.get('/alerts', c.alerts);
router.patch('/alerts/:alertId',
  body('status').optional().isIn(['active', 'resolved', 'cancelled']),
  validate,
  c.updateAlert);
router.get('/locations', c.locations);
router.get('/contacts', c.contacts);
router.get('/reports', c.reports);
router.get('/activity-logs', c.activityLogs);
router.get('/settings', c.settings);
router.get('/exports/:type', c.exportData);

module.exports = router;
