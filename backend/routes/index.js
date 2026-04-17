const router       = require('express').Router();
const authenticate = require('../middleware/authenticate');
const requireRole  = require('../middleware/requireRole');

// Public auth routes (no token needed)
router.use('/auth',  require('./auth'));

// Admin-only routes
router.use('/admin', require('./admin'));

// All routes below require a valid token
router.use(authenticate);

// All authenticated users can list team members (needed for Team + Performance sections)
router.get('/users', async (req, res) => {
    const prisma = require('../prisma/client');
    const users  = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ count: users.length, users });
});

// Clients — account managers only
router.use('/clients', requireRole('account_manager'), require('./clients'));

// Tickets — support agents + account managers
router.use('/tickets', requireRole('support', 'account_manager'), require('./tickets'));

router.get('/', (_req, res) => res.json({ message: 'API is running' }));

module.exports = router;
