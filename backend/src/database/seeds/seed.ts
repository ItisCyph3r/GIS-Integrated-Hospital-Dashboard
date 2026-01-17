import dataSource from '../typeorm.config';

async function seed() {
  const connection = await dataSource.initialize();

  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('--------------------------------');
  console.log('Clearing existing data...');
  console.log('--------------------------------');
  await connection.query(
    'TRUNCATE TABLE ambulance_movements RESTART IDENTITY CASCADE',
  );
  await connection.query(
    'TRUNCATE TABLE emergency_requests RESTART IDENTITY CASCADE',
  );
  await connection.query('TRUNCATE TABLE ambulances RESTART IDENTITY CASCADE');
  await connection.query('TRUNCATE TABLE hospitals RESTART IDENTITY CASCADE');
  console.log('--------------------------------');
  console.log('Cleared all tables');
  console.log('--------------------------------');

  // Real hospitals across Nigeria
  const hospitals = [
    {
      name: 'Lagos University Teaching Hospital (LUTH)',
      lng: 3.3792,
      lat: 6.4969,
      capacity: 761,
      services: ['trauma', 'cardiac', 'pediatric', 'general'],
    },
    {
      name: 'National Hospital Abuja',
      lng: 7.4951,
      lat: 9.0579,
      capacity: 500,
      services: ['trauma', 'cardiac', 'general'],
    },
    {
      name: 'University College Hospital (UCH) Ibadan',
      lng: 3.8964,
      lat: 7.3878,
      capacity: 850,
      services: ['trauma', 'cardiac', 'pediatric', 'general'],
    },
    {
      name: 'Aminu Kano Teaching Hospital',
      lng: 8.5167,
      lat: 11.9833,
      capacity: 500,
      services: ['general', 'trauma', 'pediatric'],
    },
    {
      name: 'University of Port Harcourt Teaching Hospital',
      lng: 7.0219,
      lat: 4.8906,
      capacity: 650,
      services: ['trauma', 'cardiac', 'general'],
    },
    {
      name: 'Obafemi Awolowo University Teaching Hospital, Ile-Ife',
      lng: 4.56,
      lat: 7.48,
      capacity: 550,
      services: ['trauma', 'general', 'pediatric'],
    },
    {
      name: 'University of Benin Teaching Hospital (UBTH)',
      lng: 5.6257,
      lat: 6.3381,
      capacity: 600,
      services: ['trauma', 'cardiac', 'general'],
    },
    {
      name: 'Ahmadu Bello University Teaching Hospital, Zaria',
      lng: 7.7063,
      lat: 11.0799,
      capacity: 500,
      services: ['general', 'trauma', 'cardiac'],
    },
    {
      name: 'Federal Medical Centre, Asaba',
      lng: 6.7371,
      lat: 6.1988,
      capacity: 350,
      services: ['general', 'pediatric'],
    },
    {
      name: 'Nnamdi Azikiwe University Teaching Hospital, Nnewi',
      lng: 6.9179,
      lat: 6.0194,
      capacity: 400,
      services: ['trauma', 'general', 'pediatric'],
    },
    {
      name: 'Eko Hospital, Lagos',
      lng: 3.4219,
      lat: 6.4433,
      capacity: 250,
      services: ['cardiac', 'general', 'trauma'],
    },
    {
      name: 'Cedar Crest Hospital, Abuja',
      lng: 7.4912,
      lat: 9.082,
      capacity: 200,
      services: ['general', 'cardiac'],
    },
  ];

  for (const hospital of hospitals) {
    await connection.query(
      `
      INSERT INTO hospitals (name, location, capacity, services)
      VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)
    `,
      [
        hospital.name,
        hospital.lng,
        hospital.lat,
        hospital.capacity,
        JSON.stringify(hospital.services),
      ],
    );
  }
  console.log('--------------------------------');
  console.log(`Created ${hospitals.length} hospitals across Nigeria`);
  console.log('--------------------------------');

  const ambulances = [
    {
      callSign: 'LASG-AMB-001',
      lng: 3.3792,
      lat: 6.5244,
      equipmentLevel: 'Advanced Life Support',
    }, // Lagos
    {
      callSign: 'LASG-AMB-002',
      lng: 3.405,
      lat: 6.4698,
      equipmentLevel: 'Basic Life Support',
    }, // Lagos Island
    {
      callSign: 'LASG-AMB-003',
      lng: 3.3515,
      lat: 6.6018,
      equipmentLevel: 'Critical Care Transport',
    }, // Ikeja
    {
      callSign: 'FCT-AMB-001',
      lng: 7.4906,
      lat: 9.0579,
      equipmentLevel: 'Advanced Life Support',
    }, // Abuja
    { callSign: 'FCT-AMB-002', lng: 7.5243, lat: 9.082, equipmentLevel: 'Basic Life Support' }, // Abuja
    { callSign: 'PH-AMB-001', lng: 7.0219, lat: 4.8156, equipmentLevel: 'Advanced Life Support' }, // Port Harcourt
    {
      callSign: 'KANO-AMB-001',
      lng: 8.5919,
      lat: 12.0022,
      equipmentLevel: 'Basic Life Support',
    }, // Kano
    { callSign: 'IBD-AMB-001', lng: 3.947, lat: 7.3775, equipmentLevel: 'Advanced Life Support' }, // Ibadan
    {
      callSign: 'BENUE-AMB-001',
      lng: 5.6257,
      lat: 6.335,
      equipmentLevel: 'Basic Life Support',
    }, // Benin City
    {
      callSign: 'ENUGU-AMB-001',
      lng: 7.4912,
      lat: 6.4411,
      equipmentLevel: 'Advanced Life Support',
    }, // Enugu
  ];

  for (const ambulance of ambulances) {
    await connection.query(
      `
      INSERT INTO ambulances ("callSign", location, "equipmentLevel", status)
      VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, 'available')
    `,
      [
        ambulance.callSign,
        ambulance.lng,
        ambulance.lat,
        ambulance.equipmentLevel,
      ],
    );
  }

  console.log('--------------------------------');
  console.log(`Created ${ambulances.length} ambulances across Nigeria`);
  console.log('--------------------------------');

  await connection.destroy();
  console.log('--------------------------------');
  console.log('Seeding completed!');
  console.log('--------------------------------');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
