/**
 * Migration: 001_initial_schema
 *
 * Creates the 7 base tables that correspond to the existing schema.sql.
 * This is the single source of truth going forward — schema.sql is now legacy.
 *
 * Tables:
 *   users, patients, drivers, hospitals, trips, otps
 *   + knex_migrations (auto-managed by Knex)
 */

exports.up = async function (knex) {
    // ── 1. users ──────────────────────────────────────────────────────────────
    const hasUsers = await knex.schema.hasTable('users');
    if (!hasUsers) {
        await knex.schema.createTable('users', (t) => {
            t.increments('id').primary();
            t.string('name').notNullable();
            t.string('email').unique().notNullable();
            t.string('password').notNullable();
            t.enu('role', ['patient', 'driver', 'hospital']).notNullable();
            t.string('phone');
            t.string('avatar_url');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // ── 2. patients ───────────────────────────────────────────────────────────
    const hasPatients = await knex.schema.hasTable('patients');
    if (!hasPatients) {
        await knex.schema.createTable('patients', (t) => {
            t.increments('id').primary();
            t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
            t.string('blood_group');
            t.text('medical_history');
            t.string('emergency_contact');
        });
    }

    // ── 3. drivers ────────────────────────────────────────────────────────────
    const hasDrivers = await knex.schema.hasTable('drivers');
    if (!hasDrivers) {
        await knex.schema.createTable('drivers', (t) => {
            t.increments('id').primary();
            t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
            t.string('license_number').unique();
            t.string('vehicle_number').unique();
            t.string('vehicle_type');
            t.string('status').defaultTo('available');
            t.float('current_lat');
            t.float('current_lng');
            t.float('rating').defaultTo(5.0);
        });
    }

    // ── 4. hospitals ──────────────────────────────────────────────────────────
    const hasHospitals = await knex.schema.hasTable('hospitals');
    if (!hasHospitals) {
        await knex.schema.createTable('hospitals', (t) => {
            t.increments('id').primary();
            t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
            t.text('address');
            t.string('city');
            t.integer('total_beds').defaultTo(0);
            t.integer('available_beds').defaultTo(0);
            t.float('latitude');
            t.float('longitude');
            t.string('specialty');
        });
    }

    // ── 5. trips ──────────────────────────────────────────────────────────────
    const hasTrips = await knex.schema.hasTable('trips');
    if (!hasTrips) {
        await knex.schema.createTable('trips', (t) => {
            t.increments('id').primary();
            t.integer('patient_id').references('id').inTable('users');
            t.integer('driver_id').references('id').inTable('users');
            t.integer('hospital_id').references('id').inTable('users');
            // requested | accepted | heading_to_patient | heading_to_hospital | completed | cancelled
            t.string('status').defaultTo('requested');
            t.float('pickup_lat');
            t.float('pickup_lng');
            t.timestamp('start_time').defaultTo(knex.fn.now());
            t.timestamp('end_time');
            t.float('total_fare');
            t.string('payment_status').defaultTo('pending');
        });
    }

    // ── 6. otps ───────────────────────────────────────────────────────────────
    const hasOtps = await knex.schema.hasTable('otps');
    if (!hasOtps) {
        await knex.schema.createTable('otps', (t) => {
            t.increments('id').primary();
            t.string('email').notNullable();
            t.string('otp').notNullable();
            t.dateTime('expires_at').notNullable();
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }
};

exports.down = async function (knex) {
    // Drop in reverse dependency order
    await knex.schema.dropTableIfExists('otps');
    await knex.schema.dropTableIfExists('trips');
    await knex.schema.dropTableIfExists('hospitals');
    await knex.schema.dropTableIfExists('drivers');
    await knex.schema.dropTableIfExists('patients');
    await knex.schema.dropTableIfExists('users');
};
