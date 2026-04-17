const router = require('express').Router();

router.use('/auth',    require('./auth'));
router.use('/clients', require('./clients'));
router.use('/tickets', require('./tickets'));

router.get('/', (_req, res) => res.json({ message: 'API is running' }));

module.exports = router;
