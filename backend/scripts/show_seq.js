const knex = require('knex');
const db = knex(require('../knexfile').development);
(async () => {
  try {
    const rows = await db.raw("SHOW CREATE TABLE seq_custom_orders_daily");
    console.log(rows[0][0]['Create Table']);
  } catch (e) {
    console.error('failed:', e.message);
  } finally { await db.destroy(); }
})();
