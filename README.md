Updated backend to add role-based auth, validation, and seed script.

- Added User model and authentication against DB users (bcrypt + JWT)
- Added express-validator checks for key endpoints
- Added seed.js to create an admin user and sample doctor/patient/appointment
- docker-compose updated to run seed on startup

Run:
  docker-compose up --build

Login for demo:
  POST /auth/login {"username":"admin","password":"admin"}

