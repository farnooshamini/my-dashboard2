const prisma = require('../prisma/client');

async function getStats(req, res) {
    try {
        const [totalUsers, totalClients, totalTickets, openTickets, criticalUnresolved] =
            await Promise.all([
                prisma.user.count(),
                prisma.client.count(),
                prisma.ticket.count(),
                prisma.ticket.count({ where: { status: 'open' } }),
                prisma.ticket.count({ where: { priority: 'critical', status: { notIn: ['resolved', 'closed'] } } }),
            ]);

        const ticketsByStatus = await prisma.ticket.groupBy({
            by: ['status'],
            _count: { id: true },
        });

        const statusBreakdown = ticketsByStatus.reduce((acc, row) => {
            acc[row.status] = row._count.id;
            return acc;
        }, {});

        return res.json({ totalUsers, totalClients, totalTickets, openTickets, criticalUnresolved, statusBreakdown });
    } catch (err) {
        console.error('[admin:getStats]', err);
        return res.status(500).json({ error: 'Failed to load stats' });
    }
}

async function getAlerts(req, res) {
    try {
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

        const [stale, critical] = await Promise.all([
            prisma.ticket.findMany({
                where: { status: { notIn: ['resolved', 'closed'] }, createdAt: { lt: cutoff } },
                orderBy: { createdAt: 'asc' },
                include: { agent: { select: { name: true } } },
            }),
            prisma.ticket.findMany({
                where: { priority: 'critical', status: { notIn: ['resolved', 'closed'] } },
                orderBy: { createdAt: 'asc' },
                include: { agent: { select: { name: true } } },
            }),
        ]);

        // Deduplicate (a ticket can match both conditions)
        const seen = new Set();
        const alerts = [...stale, ...critical].filter(t => {
            if (seen.has(t.id)) return false;
            seen.add(t.id);
            return true;
        });

        return res.json({ count: alerts.length, alerts });
    } catch (err) {
        console.error('[admin:getAlerts]', err);
        return res.status(500).json({ error: 'Failed to load alerts' });
    }
}

async function getActivity(req, res) {
    try {
        const [recentTickets, recentUsers] = await Promise.all([
            prisma.ticket.findMany({
                orderBy: { createdAt: 'desc' },
                take: 25,
                select: { id: true, subject: true, status: true, priority: true, clientEmail: true, createdAt: true, agent: { select: { name: true } } },
            }),
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { id: true, name: true, email: true, role: true, createdAt: true },
            }),
        ]);

        const activity = [
            ...recentTickets.map(t => ({
                type:      'ticket',
                icon:      t.status === 'resolved' ? 'fa-check-circle' : 'fa-ticket-alt',
                color:     t.status === 'resolved' ? 'green' : t.priority === 'critical' ? 'red' : 'purple',
                text:      `Ticket <strong>#${t.id}</strong> — ${t.subject}`,
                meta:      t.agent ? `Assigned to ${t.agent.name}` : 'Unassigned',
                status:    t.status,
                createdAt: t.createdAt,
            })),
            ...recentUsers.map(u => ({
                type:      'user',
                icon:      'fa-user-plus',
                color:     'blue',
                text:      `<strong>${u.name}</strong> registered as ${u.role.replace('_', ' ')}`,
                meta:      u.email,
                createdAt: u.createdAt,
            })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);

        return res.json({ count: activity.length, activity });
    } catch (err) {
        console.error('[admin:getActivity]', err);
        return res.status(500).json({ error: 'Failed to load activity' });
    }
}

module.exports = { getStats, getAlerts, getActivity };
