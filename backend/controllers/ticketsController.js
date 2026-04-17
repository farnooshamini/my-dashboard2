const prisma = require('../prisma/client');

const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const fail = (res, message, status) =>
  res.status(status).json({ success: false, message });

async function getAll(req, res) {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, tickets);
  } catch (err) {
    console.error('[tickets:getAll]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

async function create(req, res) {
  const { subject, clientEmail } = req.body;

  if (!subject)     return fail(res, 'Field subject is required', 400);
  if (!clientEmail) return fail(res, 'Field clientEmail is required', 400);

  const { message, status, priority, channel, assignedTo } = req.body;

  try {
    const ticket = await prisma.ticket.create({
      data: { subject, clientEmail, message, status, priority, channel, assignedTo },
    });
    return ok(res, ticket, 201);
  } catch (err) {
    console.error('[tickets:create]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

async function update(req, res) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, 'Invalid id', 400);

  try {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) return fail(res, 'Record not found', 404);

    const { subject, clientEmail, message, status, priority, channel, assignedTo } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { subject, clientEmail, message, status, priority, channel, assignedTo },
    });
    return ok(res, ticket);
  } catch (err) {
    console.error('[tickets:update]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

async function remove(req, res) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, 'Invalid id', 400);

  try {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) return fail(res, 'Record not found', 404);

    await prisma.ticket.delete({ where: { id } });
    return ok(res, { id });
  } catch (err) {
    console.error('[tickets:remove]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

module.exports = { getAll, create, update, remove };
