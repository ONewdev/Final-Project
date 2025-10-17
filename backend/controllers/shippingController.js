// controllers/shippingController.js
const db = require('../db');

// GET /api/districts?province_id=3[&only_active=1]
exports.listDistricts = async (req, res) => {
  try {
    const provinceId = Number(req.query.province_id || 0);
    const onlyActive = String(req.query.only_active || '0') === '1';
    if (!provinceId) return res.status(400).json({ message: 'province_id required' });

    // If only_active=1, return only districts that have at least one active shipping rate
    if (onlyActive) {
      const rows = await db('districts as d')
        .select('d.id', 'd.name_th', 'd.province_id')
        .where('d.province_id', provinceId)
        .whereExists(function () {
          this.select(db.raw(1))
            .from('shipping_rates as sr')
            .whereRaw('sr.district_id = d.id')
            .andWhere('sr.is_active', 1);
        })
        .orderBy('d.name_th', 'asc');
      return res.json(rows);
    }

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

// GET /api/subdistricts?district_id=32[&only_active=1]
exports.listSubdistricts = async (req, res) => {
  try {
    const districtId = Number(req.query.district_id || 0);
    const onlyActive = String(req.query.only_active || '0') === '1';
    if (!districtId) return res.status(400).json({ message: 'district_id required' });

    // If only_active=1, include subdistricts that are serviceable by active rates.
    // If there is an active district-level rate (subdistrict_id = 0), include all subdistricts.
    if (onlyActive) {
      const hasDistrictDefault = await db('shipping_rates')
        .where({ district_id: districtId, subdistrict_id: 0, is_active: 1 })
        .first();

      if (hasDistrictDefault) {
        const rows = await db('subdistricts')
          .select('id', 'name_th', 'district_id', 'postal_code')
          .where({ district_id: districtId })
          .orderBy('name_th', 'asc');
        return res.json(rows);
      }

      const rows = await db('subdistricts as sd')
        .select('sd.id', 'sd.name_th', 'sd.district_id', 'sd.postal_code')
        .where('sd.district_id', districtId)
        .whereExists(function () {
          this.select(db.raw(1))
            .from('shipping_rates as sr')
            .whereRaw('sr.subdistrict_id = sd.id')
            .andWhere('sr.district_id', districtId)
            .andWhere('sr.is_active', 1);
        })
        .orderBy('sd.name_th', 'asc');
      return res.json(rows);
    }

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
      .where({ district_id: districtId, subdistrict_id: subdistrictId, is_active: 1 })
      .first('base_fee');

    if (!rate) {
      rate = await db('shipping_rates')
        .where({ district_id: districtId, subdistrict_id: 0, is_active: 1 })
        .first('base_fee');
    }
    if (!rate) {
      rate = await db('shipping_rates')
        .where({ district_id: 0, subdistrict_id: 0, is_active: 1 })
        .first('base_fee');
    }

    const base_fee = Number(rate?.base_fee || 0);
    return res.json({ base_fee });
  } catch (e) {
    console.error('getQuote error:', e);
    return res.status(500).json({ message: 'failed to get shipping quote' });
  }
};

// GET /api/shipping-rates - ดึงรายการค่าส่งทั้งหมด
exports.getAllShippingRates = async (req, res) => {
  try {
    const rates = await db('shipping_rates as sr')
      .leftJoin('districts as d', 'sr.district_id', 'd.id')
      .leftJoin('subdistricts as sd', function() {
        this.on('sr.subdistrict_id', 'sd.id')
            .andOn('sr.district_id', 'sd.district_id');
      })
      .leftJoin('provinces as p', 'd.province_id', 'p.id')
      .select(
        'sr.id',
        'sr.district_id',
        'sr.subdistrict_id',
        'sr.base_fee',
        'sr.is_active',
        'd.name_th as district_name',
        'sd.name_th as subdistrict_name',
        'p.name_th as province_name',
        'p.id as province_id'
      )
      .orderBy('p.name_th', 'asc')
      .orderBy('d.name_th', 'asc')
      .orderBy('sd.name_th', 'asc');

    return res.json(rates);
  } catch (e) {
    console.error('getAllShippingRates error:', e);
    return res.status(500).json({ message: 'failed to get shipping rates' });
  }
};

// POST /api/shipping-rates - เพิ่มค่าส่งใหม่
exports.createShippingRate = async (req, res) => {
  try {
    const { district_id, subdistrict_id, base_fee, is_active = 1 } = req.body;

    if (!district_id || !base_fee) {
      return res.status(400).json({ message: 'district_id and base_fee are required' });
    }

    // ตรวจสอบว่ามีค่าส่งซ้ำหรือไม่
    const existing = await db('shipping_rates')
      .where({ district_id, subdistrict_id: subdistrict_id || 0 })
      .first();

    if (existing) {
      return res.status(400).json({ message: 'Shipping rate already exists for this location' });
    }

    const [id] = await db('shipping_rates').insert({
      district_id,
      subdistrict_id: subdistrict_id || 0,
      base_fee: parseFloat(base_fee),
      is_active
    });

    const newRate = await db('shipping_rates as sr')
      .leftJoin('districts as d', 'sr.district_id', 'd.id')
      .leftJoin('subdistricts as sd', function() {
        this.on('sr.subdistrict_id', 'sd.id')
            .andOn('sr.district_id', 'sd.district_id');
      })
      .leftJoin('provinces as p', 'd.province_id', 'p.id')
      .where('sr.id', id)
      .select(
        'sr.id',
        'sr.district_id',
        'sr.subdistrict_id',
        'sr.base_fee',
        'sr.is_active',
        'd.name_th as district_name',
        'sd.name_th as subdistrict_name',
        'p.name_th as province_name',
        'p.id as province_id'
      )
      .first();

    return res.status(201).json(newRate);
  } catch (e) {
    console.error('createShippingRate error:', e);
    return res.status(500).json({ message: 'failed to create shipping rate' });
  }
};

// PUT /api/shipping-rates/:id - แก้ไขค่าส่ง
exports.updateShippingRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { district_id, subdistrict_id, base_fee, is_active } = req.body;

    if (!district_id || !base_fee) {
      return res.status(400).json({ message: 'district_id and base_fee are required' });
    }

    // ตรวจสอบว่ามีค่าส่งซ้ำหรือไม่ (ยกเว้นตัวที่กำลังแก้ไข)
    const existing = await db('shipping_rates')
      .where({ district_id, subdistrict_id: subdistrict_id || 0 })
      .whereNot('id', id)
      .first();

    if (existing) {
      return res.status(400).json({ message: 'Shipping rate already exists for this location' });
    }

    await db('shipping_rates')
      .where('id', id)
      .update({
        district_id,
        subdistrict_id: subdistrict_id || 0,
        base_fee: parseFloat(base_fee),
        is_active
      });

    const updatedRate = await db('shipping_rates as sr')
      .leftJoin('districts as d', 'sr.district_id', 'd.id')
      .leftJoin('subdistricts as sd', function() {
        this.on('sr.subdistrict_id', 'sd.id')
            .andOn('sr.district_id', 'sd.district_id');
      })
      .leftJoin('provinces as p', 'd.province_id', 'p.id')
      .where('sr.id', id)
      .select(
        'sr.id',
        'sr.district_id',
        'sr.subdistrict_id',
        'sr.base_fee',
        'sr.is_active',
        'd.name_th as district_name',
        'sd.name_th as subdistrict_name',
        'p.name_th as province_name',
        'p.id as province_id'
      )
      .first();

    return res.json(updatedRate);
  } catch (e) {
    console.error('updateShippingRate error:', e);
    return res.status(500).json({ message: 'failed to update shipping rate' });
  }
};

// DELETE /api/shipping-rates/:id - ลบค่าส่ง
exports.deleteShippingRate = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await db('shipping_rates')
      .where('id', id)
      .update({ is_active: 0 });

    if (updated === 0) {
      return res.status(404).json({ message: 'Shipping rate not found' });
    }

    return res.json({ message: 'Shipping rate hidden successfully' });
  } catch (e) {
    console.error('deleteShippingRate error:', e);
    return res.status(500).json({ message: 'failed to hide shipping rate' });
  }
};

// GET /api/provinces - ดึงรายการจังหวัด
exports.getProvinces = async (req, res) => {
  try {
    const provinces = await db('provinces')
      .select('id', 'name_th')
      .orderBy('name_th', 'asc');

    return res.json(provinces);
  } catch (e) {
    console.error('getProvinces error:', e);
    return res.status(500).json({ message: 'failed to get provinces' });
  }
};
