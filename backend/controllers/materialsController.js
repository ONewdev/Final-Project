const db = require('../db'); // Knex instance


// GET /materials — list
exports.list = async (_req, res) => {
  try {
    let rows;
    try {
      rows = await db('materials')
        .select(['id', 'code', 'name', 'created_at', db.raw('COALESCE(status, 1) AS status')])
        .orderBy('id', 'asc');
    } catch (e) {
      if (e && (e.code === 'ER_BAD_FIELD_ERROR' || String(e.message || '').includes('Unknown column'))) {
        rows = await db('materials')
          .select(['id', 'code', 'name', 'created_at'])
          .orderBy('id', 'asc');
        rows = rows.map(r => ({ ...r, status: 1 }));
      } else {
        throw e;
      }
    }
    res.json(rows);
  } catch (err) {
    console.error('materials.list error:', err);
    res.status(500).json({ message: 'Fetch failed' });
  }
};


// GET /materials/:id — get one
exports.getOne = async (req, res) => {
try {
const id = Number(req.params.id);
if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });


const row = await db('materials')
.select(['id', 'code', 'name', 'created_at'])
.where({ id })
.first();


if (!row) return res.status(404).json({ message: 'Not found' });
res.json(row);
} catch (err) {
console.error('materials.getOne error:', err);
res.status(500).json({ message: 'Fetch failed' });
}
};

// POST /materials — create
exports.create = async (req, res) => {
try {
const { code, name } = req.body || {};
if (!code || !name) return res.status(400).json({ message: 'code & name required' });


const [id] = await db('materials').insert({ code, name });
const row = await db('materials')
.select(['id', 'code', 'name', 'created_at', db.raw('COALESCE(status, 1) AS status')])
.where({ id })
.first();
res.status(201).json(row);
} catch (err) {
console.error('materials.create error:', err);
res.status(500).json({ message: 'Create failed' });
}
};


// PUT /materials/:id — update
exports.update = async (req, res) => {
try {
const id = Number(req.params.id);
if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });


const { code, name } = req.body || {};
if (!code || !name) return res.status(400).json({ message: 'code & name required' });


const affected = await db('materials').where({ id }).update({ code, name });
if (!affected) return res.status(404).json({ message: 'Not found' });


const row = await db('materials')
.select(['id', 'code', 'name', 'created_at', db.raw('COALESCE(status, 1) AS status')])
.where({ id })
.first();
res.json(row);
} catch (err) {
console.error('materials.update error:', err);
res.status(500).json({ message: 'Update failed' });
}
};


// DELETE /materials/:id — delete
exports.remove = async (req, res) => {
try {
const id = Number(req.params.id);
if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });


const affected = await db('materials').where({ id }).del();
if (!affected) return res.status(404).json({ message: 'Not found' });


res.json({ ok: true });
} catch (err) {
console.error('materials.remove error:', err);
res.status(500).json({ message: 'Delete failed' });
}
};

// PATCH /materials/:id/status — set show/hide status (1 show, 0 hide)
exports.setStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid id' });
    let { status } = req.body || {};
    status = Number(status);
    if (!(status === 0 || status === 1)) return res.status(400).json({ message: 'Invalid status' });

    const exists = await db('materials').where({ id }).first();
    if (!exists) return res.status(404).json({ message: 'Not found' });

    await db('materials').where({ id }).update({ status });
    const row = await db('materials')
      .select(['id', 'code', 'name', 'created_at', db.raw('COALESCE(status, 1) AS status')])
      .where({ id })
      .first();
    res.json(row);
  } catch (err) {
    console.error('materials.setStatus error:', err);
    res.status(500).json({ message: 'Update status failed' });
  }
};
