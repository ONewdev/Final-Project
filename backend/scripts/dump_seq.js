const knex = require('knex');
const db = knex(require('../knexfile').development);
(async () => {
  try {
    const r = await db('seq_custom_orders_daily').select('*').orderBy('seq_date','desc').limit(5);
    console.log(r);
  } catch (e) { console.error(e.message);} finally { await db.destroy(); }
})();
