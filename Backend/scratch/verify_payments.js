const knex = require('knex')(require('../knexfile').development);

async function check() {
  try {
    const hasTable = await knex.schema.hasTable('payments');
    console.log('Payments table exists:', hasTable);
    
    if (hasTable) {
        const columns = await knex('payments').columnInfo();
        console.log('Columns:', Object.keys(columns));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await knex.destroy();
  }
}

check();
