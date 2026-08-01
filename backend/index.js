const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sequelize, Patient, Doctor, Appointment } = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Simple login stub: accepts username/password and returns a token for demo purposes
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  // Demo users: admin/admin
  if (username === 'admin' && password === 'admin') {
    const token = jwt.sign({ username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials (demo)' });
});

// Middleware to check token (optional for now)
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing auth token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Patients CRUD
app.get('/patients', async (req, res) => {
  const patients = await Patient.findAll();
  res.json(patients);
});
app.post('/patients', async (req, res) => {
  const p = await Patient.create(req.body);
  res.status(201).json(p);
});
app.get('/patients/:id', async (req, res) => {
  const p = await Patient.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});
app.put('/patients/:id', async (req, res) => {
  const p = await Patient.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  await p.update(req.body);
  res.json(p);
});
app.delete('/patients/:id', async (req, res) => {
  const p = await Patient.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  await p.destroy();
  res.json({ ok: true });
});

// Doctors CRUD
app.get('/doctors', async (req, res) => {
  const doctors = await Doctor.findAll();
  res.json(doctors);
});
app.post('/doctors', async (req, res) => {
  const d = await Doctor.create(req.body);
  res.status(201).json(d);
});
app.get('/doctors/:id', async (req, res) => {
  const d = await Doctor.findByPk(req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  res.json(d);
});
app.put('/doctors/:id', async (req, res) => {
  const d = await Doctor.findByPk(req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  await d.update(req.body);
  res.json(d);
});
app.delete('/doctors/:id', async (req, res) => {
  const d = await Doctor.findByPk(req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  await d.destroy();
  res.json({ ok: true });
});

// Appointments
app.get('/appointments', async (req, res) => {
  const apps = await Appointment.findAll({ include: [Doctor, Patient] });
  res.json(apps);
});
app.post('/appointments', async (req, res) => {
  const { patientId, doctorId, datetime, reason } = req.body;
  const a = await Appointment.create({ PatientId: patientId, DoctorId: doctorId, datetime, reason });
  res.status(201).json(a);
});

// Health
app.get('/', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

// Start
const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => console.log('Backend running on', PORT));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
