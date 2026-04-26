const knex = require('knex')(require('../knexfile').development);

async function checkUser() {
  const email = 'navonotfound@gmail.com';
  try {
    const user = await knex('users').where({ email }).first();
    if (user) {
      console.log('User found:', JSON.stringify(user, null, 2));
      
      // Also check if they are in role-specific tables
      if (user.role === 'patient') {
          const patient = await knex('patients').where({ user_id: user.id }).first();
          console.log('Patient details:', JSON.stringify(patient, null, 2));
      } else if (user.role === 'driver') {
          const driver = await knex('drivers').where({ user_id: user.id }).first();
          console.log('Driver details:', JSON.stringify(driver, null, 2));
      } else if (user.role === 'hospital') {
          const hospital = await knex('hospitals').where({ user_id: user.id }).first();
          console.log('Hospital details:', JSON.stringify(hospital, null, 2));
      }
    } else {
      console.log('User NOT found in database.');
      
      // Check if there are ANY users
      const count = await knex('users').count('id as count').first();
      console.log('Total users in DB:', count.count);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await knex.destroy();
  }
}

checkUser();
