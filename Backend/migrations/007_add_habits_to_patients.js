/**
 * Migration: 007_add_habits_to_patients
 *
 * Adds habits column to patients table to store habit emojis.
 */

exports.up = async function (knex) {
    await knex.schema.table('patients', (t) => {
        t.string('habits');
    });
};

exports.down = async function (knex) {
    await knex.schema.table('patients', (t) => {
        t.dropColumn('habits');
    });
};
