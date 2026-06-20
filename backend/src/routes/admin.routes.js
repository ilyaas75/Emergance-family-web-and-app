const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const c = require('../controllers/admin.controller');

router.use(protect, authorize('admin'));

router.get('/overview', c.overview);
router.get('/users', c.users);
router.post('/users',
  body('name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'member']),
  body('language').optional().isIn(['so', 'ar', 'en']),
  validate,
  c.createUser);
router.get('/users/:userId', c.getUser);
router.patch('/users/:userId',
  body('phone').optional().trim().notEmpty(),
  body('role').optional().isIn(['admin', 'member']),
  body('isActive').optional().isBoolean(),
  validate,
  c.updateUser);
router.delete('/users/:userId', c.deleteUser);
router.get('/circles', c.circles);
router.post('/circles',
  body('name').trim().notEmpty(),
  body('owner').trim().notEmpty(),
  body('type').optional().isIn(['couple', 'family']),
  validate,
  c.createCircle);
router.get('/circles/:circleId', c.getCircle);
router.patch('/circles/:circleId',
  body('type').optional().isIn(['couple', 'family']),
  validate,
  c.updateCircle);
router.delete('/circles/:circleId', c.deleteCircle);
router.get('/alerts', c.alerts);
router.get('/alerts/:alertId', c.getAlert);
router.patch('/alerts/:alertId',
  body('status').optional().isIn(['active', 'resolved', 'cancelled']),
  validate,
  c.updateAlert);
router.delete('/alerts/:alertId', c.deleteAlert);
router.get('/locations', c.locations);
router.delete('/locations/:locationId', c.deleteLocation);
router.get('/contacts', c.contacts);
router.get('/reports', c.reports);
router.get('/activity-logs', c.activityLogs);
router.get('/settings', c.settings);
router.get('/exports/:type', c.exportData);

module.exports = router;
