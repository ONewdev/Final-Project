const db = require('../db');

const toIntOrNull = (v) => (v === '' || v == null ? null : Number(v));

const ADDRESS_SELECT_FIELDS = [
  'ca.id',
  'ca.customer_id',
  'ca.label',
  'ca.recipient_name',
  'ca.phone',
  'ca.address',
  'ca.postal_code',
  'ca.subdistrict_id',
  'ca.district_id',
  'ca.province_id',
  'ca.is_default',
  'ca.created_at',
  'ca.updated_at',
  'sd.name_th as subdistrict_name',
  'sd.postal_code as subdistrict_postal_code',
  'd.name_th as district_name',
  'p.name_th as province_name',
];

function addressQuery() {
  return db('customer_addresses as ca')
    .leftJoin('subdistricts as sd', 'ca.subdistrict_id', 'sd.id')
    .leftJoin('districts as d', 'ca.district_id', 'd.id')
    .leftJoin('provinces as p', 'ca.province_id', 'p.id')
    .select(ADDRESS_SELECT_FIELDS);
}

async function fetchAddress(customerId, addressId) {
  return addressQuery()
    .where('ca.customer_id', customerId)
    .andWhere('ca.id', addressId)
    .first();
}

function ensureOwner(req, res, customerIdParam) {
  const me = req.customer?.user_id; // จาก authenticateCustomer
  if (!me || String(me) !== String(customerIdParam)) {
    res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    return false;
  }
  return true;
}

// GET /api/customers/:id/addresses
exports.list = async (req, res) => {
  const { id } = req.params;
  if (!ensureOwner(req, res, id)) return;
  try {
    const rows = await addressQuery()
      .where('ca.customer_id', id)
      .orderBy([{ column: 'ca.is_default', order: 'desc' }, { column: 'ca.updated_at', order: 'desc' }]);
    res.json(rows);
  } catch (err) {
    console.error('list addresses error:', err);
    res.status(500).json({ message: 'ดึงที่อยู่ล้มเหลว' });
  }
};

// POST /api/customers/:id/addresses
exports.create = async (req, res) => {
  const { id } = req.params;
  if (!ensureOwner(req, res, id)) return;

  const {
    label, recipient_name, phone, address, postal_code,
    subdistrict_id, district_id, province_id, is_default
  } = req.body;

  if (!address || !phone) {
    return res.status(400).json({ message: 'กรุณาระบุที่อยู่และเบอร์โทร' });
  }

  try {
    const data = {
      customer_id: Number(id),
      label: label || null,
      recipient_name: recipient_name || null,
      phone: phone || null,
      address: address || null,
      postal_code: postal_code || null,
      subdistrict_id: toIntOrNull(subdistrict_id),
      district_id: toIntOrNull(district_id),
      province_id: toIntOrNull(province_id),
      is_default: is_default ? 1 : 0,
    };

    if (data.is_default) {
      await db('customer_addresses').where({ customer_id: id }).update({ is_default: 0 });
    } else {
      const count = await db('customer_addresses').where({ customer_id: id }).count({ c: '*' }).first();
      if (Number(count.c) === 0) data.is_default = 1;
    }

    const [addrId] = await db('customer_addresses').insert(data);
    const created = await fetchAddress(id, addrId);
    res.status(201).json(created);
  } catch (err) {
    console.error('create address error:', err);
    res.status(500).json({ message: 'บันทึกที่อยู่ล้มเหลว' });
  }
};

// PUT /api/customers/:id/addresses/:addrId
exports.update = async (req, res) => {
  const { id, addrId } = req.params;
  if (!ensureOwner(req, res, id)) return;

  const {
    label, recipient_name, phone, address, postal_code,
    subdistrict_id, district_id, province_id, is_default
  } = req.body;

  try {
    const exists = await db('customer_addresses').where({ id: addrId, customer_id: id }).first();
    if (!exists) return res.status(404).json({ message: 'ไม่พบบันทึกที่อยู่' });

    const update = {
      label: typeof label === 'undefined' ? exists.label : label,
      recipient_name: typeof recipient_name === 'undefined' ? exists.recipient_name : recipient_name,
      phone: typeof phone === 'undefined' ? exists.phone : phone,
      address: typeof address === 'undefined' ? exists.address : address,
      postal_code: typeof postal_code === 'undefined' ? exists.postal_code : postal_code,
      subdistrict_id: typeof subdistrict_id === 'undefined' ? exists.subdistrict_id : toIntOrNull(subdistrict_id),
      district_id: typeof district_id === 'undefined' ? exists.district_id : toIntOrNull(district_id),
      province_id: typeof province_id === 'undefined' ? exists.province_id : toIntOrNull(province_id),
    };

    if (typeof is_default !== 'undefined') {
      if (is_default) {
        await db('customer_addresses').where({ customer_id: id }).update({ is_default: 0 });
        update.is_default = 1;
      } else {
        update.is_default = 0;
      }
    }

    await db('customer_addresses').where({ id: addrId }).update(update);
    const updated = await fetchAddress(id, addrId);
    res.json(updated);
  } catch (err) {
    console.error('update address error:', err);
    res.status(500).json({ message: 'แก้ไขที่อยู่ล้มเหลว' });
  }
};

// DELETE /api/customers/:id/addresses/:addrId
exports.remove = async (req, res) => {
  const { id, addrId } = req.params;
  if (!ensureOwner(req, res, id)) return;

  try {
    const exists = await db('customer_addresses').where({ id: addrId, customer_id: id }).first();
    if (!exists) return res.status(404).json({ message: 'ไม่พบบันทึกที่อยู่' });

    await db('customer_addresses').where({ id: addrId }).del();

    if (exists.is_default) {
      const latest = await db('customer_addresses')
        .where({ customer_id: id })
        .orderBy('updated_at', 'desc')
        .first();
      if (latest) {
        await db('customer_addresses').where({ id: latest.id }).update({ is_default: 1 });
      }
    }

    res.json({ message: 'ลบที่อยู่แล้ว' });
  } catch (err) {
    console.error('delete address error:', err);
    res.status(500).json({ message: 'ลบที่อยู่ล้มเหลว' });
  }
};

// PATCH /api/customers/:id/addresses/:addrId/default
exports.setDefault = async (req, res) => {
  const { id, addrId } = req.params;
  if (!ensureOwner(req, res, id)) return;
  try {
    const exists = await db('customer_addresses').where({ id: addrId, customer_id: id }).first();
    if (!exists) return res.status(404).json({ message: 'ไม่พบบันทึกที่อยู่' });

    await db('customer_addresses').where({ customer_id: id }).update({ is_default: 0 });
    await db('customer_addresses').where({ id: addrId }).update({ is_default: 1 });
    const updated = await fetchAddress(id, addrId);
    res.json(updated);
  } catch (err) {
    console.error('set default address error:', err);
    res.status(500).json({ message: 'ตั้งค่าเริ่มต้นล้มเหลว' });
  }
};
