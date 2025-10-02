const db = require('../db'); // Knex instance


// GET /materials — list
exports.list = async (_req, res) => {
try {
const rows = await db('materials')
.select(['id', 'code', 'name', 'created_at'])
.orderBy('id', 'asc');
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
.select(['id', 'code', 'name', 'created_at'])
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
.select(['id', 'code', 'name', 'created_at'])
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