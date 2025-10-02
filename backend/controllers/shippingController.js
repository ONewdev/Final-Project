// controllers/shippingController.js
const db = require('../db');

// GET /api/districts?province_id=3
exports.listDistricts = async (req, res) => {
  try {
    const provinceId = Number(req.query.province_id || 0);
    if (!provinceId) return res.status(400).json({ message: 'province_id required' });

    const rows = await db('districts')
      .select('id', 'name_th', 'province_id')
      .where({ province_id: provinceId })
      .orderBy('name_th', 'asc');

    return res.json(rows);
  } catch (e) {
    console.error('listDistricts error:', e);
    return res.status(500).json({ message: 'failed to list districts' });
  }
};

// GET /api/subdistricts?district_id=32
exports.listSubdistricts = async (req, res) => {
  try {
    const districtId = Number(req.query.district_id || 0);
    if (!districtId) return res.status(400).json({ message: 'district_id required' });

    const rows = await db('subdistricts')
      .select('id', 'name_th', 'district_id', 'postal_code')
      .where({ district_id: districtId })
      .orderBy('name_th', 'asc');

    return res.json(rows);
  } catch (e) {
    console.error('listSubdistricts error:', e);
    return res.status(500).json({ message: 'failed to list subdistricts' });
  }
};

// GET /api/shipping/quote?district_id=:d&subdistrict_id=:s
// เลือกเรทเฉพาะตำบล > เฉพาะอำเภอ > ค่า default (0,0)
exports.getQuote = async (req, res) => {
  try {
    const districtId = Number(req.query.district_id || 0);
    const subdistrictId = Number(req.query.subdistrict_id || 0);
    if (!districtId) return res.status(400).json({ message: 'district_id required' });

    let rate = await db('shipping_rates')
      .where({ district_id: districtId, subdistrict_id: subdistrictId })
      .first('base_fee');

    if (!rate) {
      rate = await db('shipping_rates')
        .where({ district_id: districtId, subdistrict_id: 0 })
        .first('base_fee');
    }
    if (!rate) {
      rate = await db('shipping_rates')
        .where({ district_id: 0, subdistrict_id: 0 })
        .first('base_fee');
    }

    const base_fee = Number(rate?.base_fee || 0);
    return res.json({ base_fee });
  } catch (e) {
    console.error('getQuote error:', e);
    return res.status(500).json({ message: 'failed to get shipping quote' });
  }
};
