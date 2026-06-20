const router = require('express').Router();
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/circles', require('./circle.routes'));
router.use('/admin', require('./admin.routes'));
router.get('/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));
module.exports = router;
