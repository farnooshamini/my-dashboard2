const prisma = require('../prisma/client');

const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const fail = (res, message, status) =>
  res.status(status).json({ success: false, message });

async function getAll(req, res) {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, clients);
  } catch (err) {
    console.error('[clients:getAll]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

async function create(req, res) {
  const { name, email, accountNumber } = req.body;

  if (!name)          return fail(res, 'Field name is required', 400);
  if (!email)         return fail(res, 'Field email is required', 400);
  if (!accountNumber) return fail(res, 'Field accountNumber is required', 400);

  const { balance, currency, status, assignedTo } = req.body;

  try {
    const client = await prisma.client.create({
      data: { name, email, accountNumber, balance, currency, status, assignedTo },
    });
    return ok(res, client, 201);
  } catch (err) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] ?? 'field';
      return fail(res, `A client with this ${field} already exists`, 409);
    }
    console.error('[clients:create]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

async function update(req, res) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, 'Invalid id', 400);

  try {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return fail(res, 'Record not found', 404);

    const { name, email, accountNumber, balance, currency, status, assignedTo } = req.body;

    const client = await prisma.client.update({
      where: { id },
      data: { name, email, accountNumber, balance, currency, status, assignedTo },
    });
    return ok(res, client);
  } catch (err) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] ?? 'field';
      return fail(res, `A client with this ${field} already exists`, 409);
    }
    console.error('[clients:update]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

async function remove(req, res) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return fail(res, 'Invalid id', 400);

  try {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) return fail(res, 'Record not found', 404);

    await prisma.client.delete({ where: { id } });
    return ok(res, { id });
  } catch (err) {
    console.error('[clients:remove]', err);
    return fail(res, 'Database error, please try again', 500);
  }
}

module.exports = { getAll, create, update, remove };
