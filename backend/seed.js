const bcrypt = require('bcryptjs');
const { sequelize, User, Doctor, Patient, Appointment } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    // Admin user
    const adminUsername = process.env.SEED_ADMIN_USER || 'admin';
    const adminPassword = process.env.SEED_ADMIN_PASS || 'admin';
    let admin = await User.findOne({ where: { username: adminUsername } });
    if (!admin) {
      const hash = await bcrypt.hash(adminPassword, 10);
      admin = await User.create({ username: adminUsername, passwordHash: hash, role: 'admin' });
      console.log('Created admin user:', adminUsername);
    } else {
      console.log('Admin user exists');
    }

    // Sample doctor
    let doc = await Doctor.findOne({ where: { name: 'Dr. A Sharma' } });
    if (!doc) {
      doc = await Doctor.create({ name: 'Dr. A Sharma', specialty: 'General Medicine', contact: '9876543210' });
      console.log('Created sample doctor');
    }

    // Sample patient
    let pat = await Patient.findOne({ where: { name: 'Test Patient' } });
    if (!pat) {
      pat = await Patient.create({ name: 'Test Patient', dob: '1990-01-01', contact: '9123456780' , medical_history: 'None' });
      console.log('Created sample patient');
    }

    // Sample appointment
    const existing = await Appointment.findOne({ where: { PatientId: pat.id, DoctorId: doc.id } });
    if (!existing) {
      await Appointment.create({ PatientId: pat.id, DoctorId: doc.id, datetime: new Date(), reason: 'Initial checkup' });
      console.log('Created sample appointment');
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
