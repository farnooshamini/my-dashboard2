const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const prisma = require('../prisma/client');

const SALT_ROUNDS = 10;
const SECRET      = process.env.JWT_SECRET || 'fxsp_jwt_secret_change_in_production_32chars_min';
const VALID_ROLES = ['account_manager', 'support', 'sales', 'finance'];

function signToken(user) {
    return jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        SECRET,
        { expiresIn: '7d' }
    );
}

async function register(req, res) {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!VALID_ROLES.includes(role)) {
        return res.status(403).json({ error: 'That role cannot be created via registration' });
    }

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: { name, email, passwordHash, role },
            select: { id: true, name: true, email: true, role: true },
        });

        return res.status(201).json({ user, token: signToken(user) });
    } catch (err) {
        console.error('[register]', err);
        return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
}

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email' });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
        return res.status(200).json({ user: { name: user.name, role: user.role }, token: signToken(payload) });
    } catch (err) {
        console.error('[login]', err);
        return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
}

module.exports = { register, login };
