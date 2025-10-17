// backend/controllers/chatController.js
const db = require('../db');

// GET /api/messages/contacts?userId=...
exports.getContacts = async (req, res) => {
  const userId = Number(req.query.userId);
  // ดึงรายชื่อผู้เคยแชทกับ userId (admin หรือ user)
  try {
    const contacts = await db('messages')
      .where('sender_id', userId)
      .orWhere('receiver_id', userId)
      .select('sender_id', 'receiver_id')
      .then(rows => {
        // รวม id ที่ไม่ใช่ตัวเอง
        const ids = [...new Set(rows.flatMap(r => [r.sender_id, r.receiver_id]))].filter(id => id !== userId);
        // ดึงข้อมูล user/customer
        return db('customers').whereIn('id', ids).select('id', 'name', 'email', 'profile_picture');
      });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

// GET /api/messages?senderId=...&receiverId=...
exports.getMessages = async (req, res) => {
  const { senderId, receiverId } = req.query;
  try {
    const messages = await db('messages')
      .where(function() {
        this.where('sender_id', senderId).andWhere('receiver_id', receiverId)
      })
      .orWhere(function() {
        this.where('sender_id', receiverId).andWhere('receiver_id', senderId)
      })
      .orderBy('created_at', 'asc');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// POST /api/messages
exports.sendMessage = async (req, res) => {
  const { sender_id, receiver_id, message } = req.body;
  if (!sender_id || !receiver_id || !message) return res.status(400).json({ error: 'Missing fields' });
  try {
    const [id] = await db('messages').insert({ sender_id, receiver_id, message });
    const msg = await db('messages').where({ id }).first();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// --- Unread tracking helpers & endpoints ---

// Ensure helper table for read state exists
async function ensureReadStateTable() {
  const has = await db.schema.hasTable('message_read_state');
  if (!has) {
    await db.schema.createTable('message_read_state', (table) => {
      table.increments('id').primary();
      table.integer('reader_id').notNullable();
      table.integer('peer_id').notNullable();
      table.integer('last_read_message_id').notNullable().defaultTo(0);
      table.timestamp('updated_at').defaultTo(db.fn.now());
      table.unique(['reader_id', 'peer_id']);
      table.index(['reader_id', 'peer_id']);
    });
  }
}

// GET /api/messages/unread-count?reader_id=..&peer_id=..
exports.getUnreadCount = async (req, res) => {
  try {
    const reader_id = Number(req.query.reader_id);
    const peer_id = Number(req.query.peer_id);
    if (!Number.isFinite(reader_id) || !Number.isFinite(peer_id)) {
      return res.status(400).json({ message: 'Invalid reader_id or peer_id' });
    }

    await ensureReadStateTable();

    const state = await db('message_read_state')
      .where({ reader_id, peer_id })
      .first();
    const lastReadId = state?.last_read_message_id || 0;

    const [{ cnt }] = await db('messages')
      .where({ sender_id: peer_id, receiver_id: reader_id })
      .andWhere('id', '>', lastReadId)
      .count({ cnt: '*' });

    const count = Number(cnt) || 0;
    res.json({ count });
  } catch (err) {
    console.error('messages.getUnreadCount error:', err);
    res.status(500).json({ message: 'Fetch failed' });
  }
};

// POST /api/messages/mark-read { reader_id, peer_id }
exports.markRead = async (req, res) => {
  try {
    const { reader_id, peer_id } = req.body || {};
    const readerIdNum = Number(reader_id);
    const peerIdNum = Number(peer_id);
    if (!Number.isFinite(readerIdNum) || !Number.isFinite(peerIdNum)) {
      return res.status(400).json({ message: 'Invalid reader_id or peer_id' });
    }

    await ensureReadStateTable();

    const latest = await db('messages')
      .where({ sender_id: peerIdNum, receiver_id: readerIdNum })
      .max({ maxId: 'id' })
      .first();
    const latestId = Number(latest?.maxId) || 0;

    // Upsert last_read_message_id
    if (latestId > 0) {
      try {
        await db('message_read_state')
          .insert({ reader_id: readerIdNum, peer_id: peerIdNum, last_read_message_id: latestId })
          .onConflict(['reader_id', 'peer_id'])
          .merge({ last_read_message_id: latestId, updated_at: db.fn.now() });
      } catch (e) {
        // Fallback for older MySQL versions without onConflict emulation
        const updated = await db('message_read_state')
          .where({ reader_id: readerIdNum, peer_id: peerIdNum })
          .update({ last_read_message_id: latestId, updated_at: db.fn.now() });
        if (!updated) {
          await db('message_read_state').insert({ reader_id: readerIdNum, peer_id: peerIdNum, last_read_message_id: latestId });
        }
      }
    } else {
      // No messages to mark; still ensure a state row exists
      try {
        await db('message_read_state')
          .insert({ reader_id: readerIdNum, peer_id: peerIdNum, last_read_message_id: 0 })
          .onConflict(['reader_id', 'peer_id'])
          .merge({ updated_at: db.fn.now() });
      } catch {}
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('messages.markRead error:', err);
    res.status(500).json({ message: 'Update failed' });
  }
};
