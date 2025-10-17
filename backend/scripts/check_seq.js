const knex = require('knex');
const config = require('../knexfile');
const db = knex(config.development);
(async () => {
  try {
    const [row] = await db('information_schema.tables')
      .select('table_name')
      .where({ table_schema: config.development.connection.database, table_name: 'seq_custom_orders_daily' });
    console.log('seq_custom_orders_daily exists:', !!row);
    const [hasCustomers] = await db('information_schema.tables')
      .select('table_name')
      .where({ table_schema: config.development.connection.database, table_name: 'customers' });
    console.log('customers exists:', !!hasCustomers);
    process.exit(0);
  } catch (e) {
    console.error('check failed:', e.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
})();
