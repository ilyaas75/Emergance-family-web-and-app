const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { circleMember } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const c = require('../controllers/alert.controller');

router.use(circleMember);
router.get('/', c.list);
router.post('/',
  body('type').optional().isIn(['sos', 'checkin']),
  body('note').optional().trim().isLength({ max: 500 }),
  body('lng').optional().isFloat(),
  body('lat').optional().isFloat(),
  validate,
  c.create);
router.get('/:alertId', c.getOne);
router.post('/:alertId/respond', body('status').optional().isIn(['responding', 'arrived', 'safe', 'help']), validate, c.respond);
router.post('/:alertId/resolve', c.resolve);
// audio / video evidence
router.post('/:alertId/media', upload.single('file'), c.uploadMedia);

module.exports = router;
