const knex = require('knex');
const db = knex(require('../knexfile').development);
(async () => {
  try {
    const insertPayload = {
      user_id: 2,
      category: String('1'),
      product_type: String('window'),
      width: Number(100),
      height: Number(120),
      unit: 'cm',
      color: '',
      quantity: 1,
      details: null,
      has_screen: 0,
      round_frame: 0,
      swing_type: '',
      mode: '',
      fixed_left_m2: 0,
      fixed_right_m2: 0,
      price: 5000,
      shipping_method: 'pickup',
      shipping_fee: 0,
      shipping_address: 'pickup',
      phone: null,
      province_id: null,
      district_id: null,
      subdistrict_id: null,
      postal_code: null,
      status: 'pending',
      created_at: db.fn.now(),
    };
    const r = await db('custom_orders').insert(insertPayload);
    console.log('insert ok:', r);
  } catch (e) {
    console.error('insert failed:', e && (e.sqlMessage || e.message) );
    console.error('code:', e && e.code);
  } finally {
    await db.destroy();
  }
})();
