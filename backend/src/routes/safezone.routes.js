const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { circleMember, circleAdmin } = require('../middleware/rbac');
const c = require('../controllers/safezone.controller');

router.use(circleMember);
router.get('/', c.list);
router.post('/', circleAdmin, body('name').notEmpty(), body('lng').isFloat(), body('lat').isFloat(), validate, c.create);
router.put('/:zoneId', circleAdmin, c.update);
router.delete('/:zoneId', circleAdmin, c.remove);

module.exports = router;
