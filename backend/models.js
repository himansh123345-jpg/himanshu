// backend models and Sequelize setup
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME || 'hospital', process.env.DB_USER || 'postgres', process.env.DB_PASS || 'postgres', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
});

const Patient = sequelize.define('Patient', {
  name: { type: DataTypes.STRING, allowNull: false },
  dob: { type: DataTypes.DATEONLY },
  contact: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  medical_history: { type: DataTypes.TEXT },
});

const Doctor = sequelize.define('Doctor', {
  name: { type: DataTypes.STRING, allowNull: false },
  specialty: { type: DataTypes.STRING },
  contact: { type: DataTypes.STRING },
});

const Appointment = sequelize.define('Appointment', {
  datetime: { type: DataTypes.DATE, allowNull: false },
  reason: { type: DataTypes.TEXT },
});

Doctor.hasMany(Appointment);
Patient.hasMany(Appointment);
Appointment.belongsTo(Doctor);
Appointment.belongsTo(Patient);

module.exports = {
  sequelize,
  Patient,
  Doctor,
  Appointment,
};
