const router      = require('express').Router();
const authenticate = require('../middleware/authenticate');
const requireRole  = require('../middleware/requireRole');
const { getStats, getAlerts, getActivity } = require('../controllers/adminController');

router.use(authenticate);
router.use(requireRole('administrator'));

router.get('/stats',    getStats);
router.get('/alerts',   getAlerts);
router.get('/activity', getActivity);

module.exports = router;
