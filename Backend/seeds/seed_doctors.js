/**
 * Seed: Doctors
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('appointments').del();
  await knex('doctors').del();
  
  // Get a valid hospital id
  const hospital = await knex('hospitals').first();
  const hospitalId = hospital ? hospital.id : null;

  // Inserts seed entries
  await knex('doctors').insert([
    {
      name: 'Dr. Sarah Wilson',
      specialization: 'Cardiologist',
      hospital_id: hospitalId,
      phone: '+91 98765 43210',
      experience_years: 12,
      rating: 4.9,
      availability_status: 'available',
      fees: 800,
      image_url: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=2563eb&color=fff'
    },
    {
      name: 'Dr. Michael Chen',
      specialization: 'Neurologist',
      hospital_id: hospitalId,
      phone: '+91 98765 43211',
      experience_years: 8,
      rating: 4.7,
      availability_status: 'available',
      fees: 1000,
      image_url: 'https://ui-avatars.com/api/?name=Michael+Chen&background=16a34a&color=fff'
    },
    {
      name: 'Dr. Priya Sharma',
      specialization: 'Endocrinologist',
      hospital_id: hospitalId,
      phone: '+91 98765 43212',
      experience_years: 15,
      rating: 4.9,
      availability_status: 'busy',
      fees: 1200,
      image_url: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=dc2626&color=fff'
    },
    {
      name: 'Dr. James Bond',
      specialization: 'General Surgeon',
      hospital_id: hospitalId,
      phone: '+91 00000 00007',
      experience_years: 20,
      rating: 5.0,
      availability_status: 'available',
      fees: 2000,
      image_url: 'https://ui-avatars.com/api/?name=James+Bond&background=000&color=fff'
    }
  ]);
};
