const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'fxsp_jwt_secret_change_in_production_32chars_min';

function authenticate(req, res, next) {
    const header = req.headers['authorization'] || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authenticate;
