/**
 * Migration: 002_add_patient_profile_fields
 *
 * Adds new columns to the patients table to support the detailed
 * minimalistic patient profile requested by the user.
 */

exports.up = async function (knex) {
    await knex.schema.table('patients', (t) => {
        t.string('gender');
        t.date('date_of_birth');
        t.float('height');
        t.float('weight');
        t.string('home_location');
        t.string('blood_pressure');
        t.text('allergies');
        t.text('chronic_conditions');
    });
};

exports.down = async function (knex) {
    await knex.schema.table('patients', (t) => {
        t.dropColumn('gender');
        t.dropColumn('date_of_birth');
        t.dropColumn('height');
        t.dropColumn('weight');
        t.dropColumn('home_location');
        t.dropColumn('blood_pressure');
        t.dropColumn('allergies');
        t.dropColumn('chronic_conditions');
    });
};
