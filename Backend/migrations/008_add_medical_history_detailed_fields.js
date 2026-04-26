/**
 * Migration: 008_add_medical_history_detailed_fields
 *
 * Adds specific medical history fields as shown in the dashboard UI.
 */

exports.up = async function (knex) {
    await knex.schema.table('patients', (t) => {
        t.text('chronic_disease');
        t.text('diabetes_emergencies');
        t.text('surgeries');
        t.text('family_history');
        t.text('diabetes_complications');
    });
};

exports.down = async function (knex) {
    await knex.schema.table('patients', (t) => {
        t.dropColumn('chronic_disease');
        t.dropColumn('diabetes_emergencies');
        t.dropColumn('surgeries');
        t.dropColumn('family_history');
        t.dropColumn('diabetes_complications');
    });
};
