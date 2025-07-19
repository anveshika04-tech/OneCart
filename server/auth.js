import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const router = express.Router();

const USERS_FILE = './users.json';
const JWT_SECRET = 'your_secret_key';

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Signup
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const users = readUsers();
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const hashed = bcrypt.hashSync(password, 10);
  const user = { name, email, password: hashed };
  users.push(user);
  writeUsers(users);
  const token = jwt.sign({ name, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { name, email } });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ name: user.name, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { name: user.name, email } });
});

export default router; 