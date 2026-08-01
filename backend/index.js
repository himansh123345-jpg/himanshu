const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const { sequelize, Patient, Doctor, Appointment, User } = require('./models');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Auth: login against User model
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token });
});

// Middleware to check token
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

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Create user (admin only)
app.post('/users', auth, requireRole('admin'), [
  check('username').isLength({ min: 3 }),
  check('password').isLength({ min: 4 }),
  check('role').isIn(['admin','doctor','receptionist']).optional(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { username, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const u = await User.create({ username, passwordHash: hash, role: role || 'receptionist' });
    return res.status(201).json({ id: u.id, username: u.username, role: u.role });
  } catch (err) {
    return res.status(400).json({ error: 'Could not create user', detail: err.message });
  }
});

// Patients CRUD with basic validation
app.get('/patients', auth, async (req, res) => {
  const patients = await Patient.findAll();
  res.json(patients);
});
app.post('/patients', auth, requireRole('receptionist'), [
  check('name').isLength({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const p = await Patient.create(req.body);
  res.status(201).json(p);
});
app.get('/patients/:id', auth, async (req, res) => {
  const p = await Patient.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});
app.put('/patients/:id', auth, requireRole('receptionist'), async (req, res) => {
  const p = await Patient.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  await p.update(req.body);
  res.json(p);
});
app.delete('/patients/:id', auth, requireRole('admin'), async (req, res) => {
  const p = await Patient.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  await p.destroy();
  res.json({ ok: true });
});

// Doctors CRUD
app.get('/doctors', auth, async (req, res) => {
  const doctors = await Doctor.findAll();
  res.json(doctors);
});
app.post('/doctors', auth, requireRole('admin'), [check('name').isLength({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const d = await Doctor.create(req.body);
  res.status(201).json(d);
});
app.get('/doctors/:id', auth, async (req, res) => {
  const d = await Doctor.findByPk(req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  res.json(d);
});
app.put('/doctors/:id', auth, requireRole('admin'), async (req, res) => {
  const d = await Doctor.findByPk(req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  await d.update(req.body);
  res.json(d);
});
app.delete('/doctors/:id', auth, requireRole('admin'), async (req, res) => {
  const d = await Doctor.findByPk(req.params.id);
  if (!d) return res.status(404).json({ error: 'Not found' });
  await d.destroy();
  res.json({ ok: true });
});

// Appointments
app.get('/appointments', auth, async (req, res) => {
  const apps = await Appointment.findAll({ include: [Doctor, Patient] });
  res.json(apps);
});
app.post('/appointments', auth, requireRole('receptionist'), [
  check('patientId').isInt(),
  check('doctorId').isInt(),
  check('datetime').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { patientId, doctorId, datetime, reason } = req.body;
  const patient = await Patient.findByPk(patientId);
  const doctor = await Doctor.findByPk(doctorId);
  if (!patient || !doctor) return res.status(400).json({ error: 'Invalid patientId or doctorId' });
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
