/**
 * Migration: 006_add_diagnosis_and_barriers
 *
 * Adds own_diagnosis and health_barriers columns to patients table.
 */

exports.up = async function (knex) {
    await knex.schema.table('patients', (t) => {
        t.text('own_diagnosis');
        t.text('health_barriers');
    });
};

exports.down = async function (knex) {
    await knex.schema.table('patients', (t) => {
        t.dropColumn('own_diagnosis');
        t.dropColumn('health_barriers');
    });
};
