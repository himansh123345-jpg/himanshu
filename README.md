# Hospital MVP

This repository contains a minimal hospital management MVP (backend API + simple frontend) scaffold.

Features:
- Backend: Node.js + Express
- Database: PostgreSQL (via docker-compose)
- Simple models: Patient, Doctor, Appointment
- Simple JWT auth stub (for demo)
- Frontend: static HTML app served by nginx (simple demo UI)
- Dockerized: docker-compose to run db + backend + frontend

Quick start
1. Copy `.env.example` to `.env` in the backend folder and adjust values if needed.
2. Run: docker-compose up --build
3. Backend: http://localhost:4000
4. Frontend: http://localhost:3000

API endpoints (examples):
- POST /auth/login {"username":"admin","password":"admin"} -> { token }
- Patients: GET /patients, POST /patients, GET /patients/:id, PUT /patients/:id, DELETE /patients/:id
- Doctors: similar to patients under /doctors
- Appointments: POST /appointments, GET /appointments

Notes
- This is an MVP scaffold. Enhance validation, error handling, and authentication before production.
