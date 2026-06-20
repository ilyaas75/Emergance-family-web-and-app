const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { circleMember, circleAdmin } = require('../middleware/rbac');
const c = require('../controllers/circle.controller');

// nested resource routers
const locationRoutes = require('./location.routes');
const alertRoutes = require('./alert.routes');
const checkinRoutes = require('./checkin.routes');
const safezoneRoutes = require('./safezone.routes');

router.use(protect);

router.post('/', body('name').trim().notEmpty(), body('type').optional().isIn(['couple', 'family']), validate, c.create);
router.get('/mine', c.listMine);
router.post('/join', body('inviteCode').trim().notEmpty(), validate, c.join);

router.get('/:circleId', circleMember, c.getOne);
router.put('/:circleId', circleMember, circleAdmin, c.update);
router.delete('/:circleId', circleMember, c.remove);
router.post('/:circleId/leave', circleMember, c.leave);
router.put('/:circleId/members/:userId', circleMember, circleAdmin, c.setMemberRole);
router.delete('/:circleId/members/:userId', circleMember, circleAdmin, c.removeMember);

// mount nested resources (all require circle membership inside their files)
router.use('/:circleId/locations', locationRoutes);
router.use('/:circleId/location', locationRoutes);
router.use('/:circleId/alerts', alertRoutes);
router.use('/:circleId/checkins', checkinRoutes);
router.use('/:circleId/safezones', safezoneRoutes);

module.exports = router;
