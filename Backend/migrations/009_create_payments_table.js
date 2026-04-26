/**
 * Migration: 009_create_payments_table
 * 
 * Creates the 'payments' table to track financial transactions for trips.
 * This replaces the client-side simulation previously used.
 */

exports.up = async function (knex) {
    const hasTable = await knex.schema.hasTable('payments');
    if (!hasTable) {
        await knex.schema.createTable('payments', (t) => {
            t.increments('id').primary();
            
            // Link to the trip
            t.integer('trip_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('trips')
                .onDelete('CASCADE');
            
            // Link to the patient (user)
            t.integer('patient_id')
                .unsigned()
                .notNullable()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE');
            
            // Fare details
            t.float('base_fare').notNullable();
            t.float('equipment_charge').defaultTo(0);
            t.float('platform_charge').defaultTo(0);
            t.float('discount_amount').defaultTo(0);
            t.string('discount_type');
            t.float('donation_amount').defaultTo(0);
            t.float('total_amount').notNullable();
            
            // Payment metadata
            t.enu('payment_method', ['card', 'upi', 'cash']).notNullable();
            t.string('transaction_id').unique();
            t.string('status').defaultTo('pending'); // pending, completed, failed, refunded
            
            t.timestamp('created_at').defaultTo(knex.fn.now());
            t.timestamp('updated_at').defaultTo(knex.fn.now());
        });
    }
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('payments');
};
