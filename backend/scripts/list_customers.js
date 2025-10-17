const knex = require('knex');
const config = require('../knexfile');
const db = knex(config.development);
(async () => {
  try {
    const users = await db('customers').select('id').limit(5);
    console.log('customers sample:', users);
  } catch (e) {
    console.error('query failed:', e.message);
  } finally {
    await db.destroy();
  }
})();
