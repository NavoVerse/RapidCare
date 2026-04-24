/**
 * Migration: 003_add_driver_profile_fields
 *
 * Adds new columns to the drivers table to support the 5-step
 * driver registration form (KYC, address, etc).
 */

exports.up = async function (knex) {
    await knex.schema.table('drivers', (t) => {
        t.date('dob');
        t.string('alt_phone');
        t.text('address');
        t.string('city');
        t.string('state');
        t.string('pincode');
        t.string('aadhaar_number');
        t.string('pan_number');
        // We will keep documents as a JSON string or just ignore them for now since we don't have S3 set up.
        // For now, we will store them as string paths/flags
        t.text('documents'); 
    });
};

exports.down = async function (knex) {
    await knex.schema.table('drivers', (t) => {
        t.dropColumn('dob');
        t.dropColumn('alt_phone');
        t.dropColumn('address');
        t.dropColumn('city');
        t.dropColumn('state');
        t.dropColumn('pincode');
        t.dropColumn('aadhaar_number');
        t.dropColumn('pan_number');
        t.dropColumn('documents');
    });
};
