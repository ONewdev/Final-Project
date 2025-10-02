const db = require('../db');


exports.getNotificationsByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.query;
    if (!customer_id) {
      return res.status(400).json({ success: false, message: 'customer_id is required' });
    }

    const rows = await db('notifications')
      .select('*')
      .where({ customer_id })
      .orderBy('created_at', 'desc');

    res.json(rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: err.message });
  }
};

// POST /api/notifications (สร้างใหม่)
exports.createNotification = async (req, res) => {
  try {
    const { customer_id, type, title, message } = req.body;
    if (!customer_id || !type || !title || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // NOTE: ใน MySQL/SQLite ค่านี้จะเป็น insertId (number)
    const [insertId] = await db('notifications').insert({
      customer_id,
      type,
      title,
      message,
      created_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      id: insertId
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ success: false, message: 'Failed to create notification', error: err.message });
  }
};

// GET /api/notifications/unread_count?customer_id=123
// นับเฉพาะที่ "ยังไม่อ่าน" = created_at > last_seen_notifications_at
exports.getUnreadCountByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.query;
    if (!customer_id) {
      return res.status(400).json({ success: false, message: 'customer_id is required' });
    }

    const customer = await db('customers')
      .select('last_seen_notifications_at')
      .where({ id: customer_id })
      .first();

    const lastSeen = customer?.last_seen_notifications_at;

    const row = await db('notifications')
      .where({ customer_id })
      .modify((qb) => {
        if (lastSeen) qb.where('created_at', '>', lastSeen);
      })
      .count({ count: '*' })
      .first();

    res.json({ count: Number(row?.count) || 0 });
  } catch (err) {
    console.error('Error counting notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to count notifications', error: err.message });
  }
};

// POST /api/notifications/mark_read  { customer_id }
// อัปเดต "เวลาเห็นล่าสุด" เป็นตอนนี้ → ทำให้ทั้งหมดถือว่าอ่านแล้ว
exports.markAllReadByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.body;
    if (!customer_id) {
      return res.status(400).json({ success: false, message: 'customer_id is required' });
    }

    const affected = await db('customers')
      .where({ id: customer_id })
      .update({ last_seen_notifications_at: db.fn.now() });

    // affected = จำนวนแถวที่อัปเดตได้ (0 แปลว่าไม่มี user นี้)
    res.json({ success: true, message: 'Marked all notifications as read', affected });
  } catch (err) {
    console.error('Error marking notifications as read:', err);
    res.status(500).json({ success: false, message: 'Failed to mark as read', error: err.message });
  }
};
exports.markReadById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Notification id is required' });
  }
  try {
    const affected = await db('notifications')
      .where({ id })
      .update({ is_read: 1, read_at: db.fn.now() });
    if (affected > 0) {
      res.json({ success: true, message: 'Notification marked as read', affected });
    } else {
      res.status(404).json({ success: false, message: 'Notification not found' });
    }
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: err.message });
  }
};