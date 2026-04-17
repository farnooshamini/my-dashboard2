const router = require('express').Router();

// Mount feature routes here as you add them
// e.g. router.use('/users', require('./users'));

router.get('/', (_req, res) => res.json({ message: 'API is running' }));

module.exports = router;
