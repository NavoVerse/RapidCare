/**
 * Migration: Create Payments Table (Restored to satisfy Knex integrity check)
 */
exports.up = function(knex) {
  // Guard against table already existing (likely from 009_ migration)
  return knex.schema.hasTable('payments').then(exists => {
    if (!exists) {
      return knex.schema.createTable('payments', (t) => {
        t.increments('id').primary();
        t.integer('trip_id').references('id').inTable('trips').onDelete('CASCADE').notNullable();
        t.integer('patient_id').references('id').inTable('users').onDelete('SET NULL');
        t.float('amount').notNullable();
        t.string('currency').defaultTo('INR');
        t.string('status').defaultTo('pending');
        t.string('payment_method');
        t.string('transaction_id').unique();
        t.text('payment_gateway_response');
        t.timestamps(true, true);
      });
    }
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('payments');
};
