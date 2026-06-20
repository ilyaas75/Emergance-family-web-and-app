const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { circleMember } = require('../middleware/rbac');
const c = require('../controllers/checkin.controller');

router.use(circleMember);
router.get('/', c.list);
router.post('/', c.create);
router.post('/:checkinId/respond', body('status').isIn(['safe', 'help']), validate, c.respond);

module.exports = router;
