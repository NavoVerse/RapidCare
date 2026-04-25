/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('medical_records', table => {
        table.increments('id').primary();
        table.integer('patient_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('hospital_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
        table.integer('doctor_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
        table.string('diagnosis');
        table.text('treatment_plan');
        table.text('clinical_notes');
        table.string('status').defaultTo('active');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('prescriptions', table => {
        table.increments('id').primary();
        table.integer('medical_record_id').unsigned().references('id').inTable('medical_records').onDelete('CASCADE');
        table.integer('patient_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('medication_name').notNullable();
        table.string('indication');
        table.string('status').defaultTo('active'); 
        table.string('sig'); 
        table.string('start_date');
        table.string('assigned_by');
        table.text('notes');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('prescriptions')
    .dropTableIfExists('medical_records');
};
