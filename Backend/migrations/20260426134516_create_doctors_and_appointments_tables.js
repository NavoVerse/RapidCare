/**
 * Migration: Create Doctors and Appointments Tables
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('doctors', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('specialization').notNullable();
      t.integer('hospital_id').references('id').inTable('hospitals').onDelete('SET NULL');
      t.string('phone');
      t.integer('experience_years');
      t.float('rating').defaultTo(5.0);
      t.string('availability_status').defaultTo('available'); // available | busy | offline
      t.float('fees').defaultTo(0.0);
      t.string('image_url');
      t.timestamps(true, true);
    })
    .createTable('appointments', (t) => {
      t.increments('id').primary();
      t.integer('patient_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
      t.integer('doctor_id').references('id').inTable('doctors').onDelete('CASCADE').notNullable();
      t.integer('hospital_id').references('id').inTable('hospitals').onDelete('SET NULL');
      t.dateTime('appointment_date').notNullable();
      t.string('status').defaultTo('pending'); // pending | confirmed | completed | cancelled
      t.string('type').defaultTo('in-person'); // in-person | online
      t.text('notes');
      t.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('appointments')
    .dropTableIfExists('doctors');
};
