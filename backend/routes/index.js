const router = require('express').Router();

router.use('/auth',    require('./auth'));
router.use('/clients', require('./clients'));
router.use('/tickets', require('./tickets'));

router.get('/', (_req, res) => res.json({ message: 'API is running' }));

router.get('/users', async (_req, res) => {
    const prisma = require('../prisma/client');
    const users  = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ count: users.length, users });
});

module.exports = router;
