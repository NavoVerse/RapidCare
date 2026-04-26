/**
 * Migration: Create Insurance Policies and Claims Tables
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('insurance_policies', (t) => {
      t.increments('id').primary();
      t.integer('patient_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
      t.string('policy_number').notNullable();
      t.string('provider_name').notNullable();
      t.string('category').notNullable(); // State | Central | Mediclaim | Private
      t.float('coverage_amount').defaultTo(0);
      t.float('used_amount').defaultTo(0);
      t.string('status').defaultTo('active');
      t.string('portal_link');
      t.timestamps(true, true);
    })
    .createTable('insurance_claims', (t) => {
      t.increments('id').primary();
      t.integer('patient_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
      t.integer('policy_id').references('id').inTable('insurance_policies').onDelete('CASCADE').notNullable();
      t.dateTime('claim_date').defaultTo(knex.fn.now());
      t.string('claim_type'); // OPD | Inpatient | Pharmacy | Diagnostics
      t.float('amount').notNullable();
      t.string('status').defaultTo('pending'); // pending | approved | rejected
      t.string('reference_number').unique();
      t.integer('hospital_id').references('id').inTable('hospitals').onDelete('SET NULL');
      t.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('insurance_claims')
    .dropTableIfExists('insurance_policies');
};
