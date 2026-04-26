/**
 * Seed: Core Users (Patient, Driver, Hospital)
 */
const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Clear existing data in reverse dependency order
  await knex('appointments').del();
  await knex('doctors').del();
  await knex('trips').del();
  await knex('hospitals').del();
  await knex('drivers').del();
  await knex('patients').del();
  await knex('users').del();

  const password = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const [pId] = await knex('users').insert({ name: 'Default Patient', email: 'patient@rapidcare.com', password, role: 'patient', phone: '9000000001' }).returning('id');
  const [dId] = await knex('users').insert({ name: 'Default Driver', email: 'driver@rapidcare.com', password, role: 'driver', phone: '9000000002' }).returning('id');
  const [hId] = await knex('users').insert({ name: 'Main General Hospital', email: 'hospital@rapidcare.com', password, role: 'hospital', phone: '9000000003' }).returning('id');

  const pid = typeof pId === 'object' ? pId.id : pId;
  const did = typeof dId === 'object' ? dId.id : dId;
  const hid = typeof hId === 'object' ? hId.id : hId;

  // 2. Create Profiles
  await knex('patients').insert({ user_id: pid, blood_group: 'O+', gender: 'male', date_of_birth: '1990-01-01' });
  await knex('drivers').insert({ user_id: did, status: 'available', license_number: 'DL12345', vehicle_number: 'RC67890', current_lat: 12.9716, current_lng: 77.5946 });
  await knex('hospitals').insert({ user_id: hid, address: '123 Healthcare Ave', city: 'Metropolis', total_beds: 100, available_beds: 50, latitude: 12.9750, longitude: 77.5900 });

  console.log('✅ Core database seed completed.');
};
