const router = require('express').Router();

router.use('/auth', require('./auth'));

router.get('/', (_req, res) => res.json({ message: 'API is running' }));

module.exports = router;
