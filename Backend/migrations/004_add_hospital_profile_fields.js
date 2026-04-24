/**
 * Migration: 004_add_hospital_profile_fields
 *
 * Adds new columns to the hospitals table to support the 5-step
 * hospital registration form.
 */

exports.up = async function (knex) {
    await knex.schema.table('hospitals', (t) => {
        // Step 1: Basic Info
        t.string('hospital_type');
        t.integer('year_established');
        t.string('district');
        t.string('state');
        t.string('pincode');
        
        // Step 2: Compliance
        t.string('state_health_license');
        t.date('license_expiry');
        t.string('nabh_accreditation');
        t.string('nabl_accreditation');
        t.string('pharmacy_license');
        t.string('fire_noc');
        t.string('pan_tan');
        t.string('gst');

        // Step 3: Contacts
        t.string('reception_number');
        t.string('emergency_casualty_number');
        t.string('ambulance_dispatch_number');
        t.string('icu_helpline');
        t.string('admin_billing_number');
        t.string('website');

        // Step 4: Infra
        t.integer('icu_beds').defaultTo(0);
        t.integer('nicu_beds').defaultTo(0);
        t.integer('picu_beds').defaultTo(0);
        t.integer('ccu_beds').defaultTo(0);
        t.integer('ventilators').defaultTo(0);
        t.integer('dialysis').defaultTo(0);
        t.integer('ot').defaultTo(0);
        t.integer('ambulances').defaultTo(0);
        t.text('departments'); // JSON string of selected checkboxes

        // Step 5: Admin & Insurance
        t.string('ayushman_bharat');
        t.string('state_insurance');
        t.string('admin_name');
        t.string('designation');
    });
};

exports.down = async function (knex) {
    await knex.schema.table('hospitals', (t) => {
        t.dropColumn('hospital_type');
        t.dropColumn('year_established');
        t.dropColumn('district');
        t.dropColumn('state');
        t.dropColumn('pincode');
        
        t.dropColumn('state_health_license');
        t.dropColumn('license_expiry');
        t.dropColumn('nabh_accreditation');
        t.dropColumn('nabl_accreditation');
        t.dropColumn('pharmacy_license');
        t.dropColumn('fire_noc');
        t.dropColumn('pan_tan');
        t.dropColumn('gst');

        t.dropColumn('reception_number');
        t.dropColumn('emergency_casualty_number');
        t.dropColumn('ambulance_dispatch_number');
        t.dropColumn('icu_helpline');
        t.dropColumn('admin_billing_number');
        t.dropColumn('website');

        t.dropColumn('icu_beds');
        t.dropColumn('nicu_beds');
        t.dropColumn('picu_beds');
        t.dropColumn('ccu_beds');
        t.dropColumn('ventilators');
        t.dropColumn('dialysis');
        t.dropColumn('ot');
        t.dropColumn('ambulances');
        t.dropColumn('departments');

        t.dropColumn('ayushman_bharat');
        t.dropColumn('state_insurance');
        t.dropColumn('admin_name');
        t.dropColumn('designation');
    });
};
