/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.hasTable('payments').then(exists => {
    if (!exists) {
      return knex.schema.createTable('payments', (table) => {
        table.increments('id').primary();
        table.string('order_id').notNullable();
        table.string('payment_id').nullable();
        table.string('status').notNullable().defaultTo('pending');
        table.decimal('amount', 10, 2).notNullable();
        table.string('currency').defaultTo('INR');
        table.string('user_id').notNullable();
        table.json('payment_details').nullable();
        table.timestamps(true, true);
      });
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('payments');
};
