/**
 * Migration: Create Payments Table
 */
exports.up = function(knex) {
  return knex.schema.createTable('payments', (t) => {
    t.increments('id').primary();
    t.integer('trip_id').references('id').inTable('trips').onDelete('CASCADE').notNullable();
    t.integer('patient_id').references('id').inTable('users').onDelete('SET NULL');
    t.float('amount').notNullable();
    t.string('currency').defaultTo('INR');
    
    // Status: pending | completed | failed | refunded
    t.string('status').defaultTo('pending');
    
    // Method: upi | card | net_banking | cash | wallet
    t.string('payment_method');
    
    t.string('transaction_id').unique();
    t.text('payment_gateway_response'); // For storing JSON from Stripe/Razorpay
    
    t.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('payments');
};
