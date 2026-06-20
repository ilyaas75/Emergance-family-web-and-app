const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { circleMember } = require('../middleware/rbac');
const c = require('../controllers/location.controller');

router.use(circleMember);
router.get('/history', c.history);
router.get('/activity', c.activity);
router.get('/', c.listForCircle);
router.post('/',
  body('lng').isFloat(), body('lat').isFloat(),
  body('battery').optional().isInt({ min: 0, max: 100 }),
  body('accuracy').optional().isFloat({ min: 0 }),
  body('speed').optional().isFloat({ min: 0 }),
  body('heading').optional().isFloat({ min: 0, max: 360 }),
  body('moving').optional().isBoolean(),
  validate, c.update);

module.exports = router;
