import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import * as repo from './authRepository.js';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitize(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function register({ name, email, password }) {
  const existing = await repo.findByEmail(email);
  if (existing) throw { status: 409, message: 'El email ya está registrado' };

  const password_hash = await bcrypt.hash(password, 10);
  const user = {
    id: randomUUID(),
    name,
    email,
    password_hash,
    gender: null,
    weight_kg: null,
    height_cm: null,
    age: null,
    wake_hour: 7,
    sleep_hour: 23,
    timezone: 'America/Argentina/Buenos_Aires',
    created_at: new Date().toISOString(),
  };
  await repo.createUser(user);
  const token = signToken(user);
  return { token, user: sanitize(user) };
}

export async function login({ email, password }) {
  const user = await repo.findByEmail(email);
  if (!user) throw { status: 401, message: 'Credenciales inválidas' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Credenciales inválidas' };

  const token = signToken(user);
  return { token, user: sanitize(user) };
}

export async function getMe(id) {
  const user = await repo.findById(id);
  if (!user) throw { status: 404, message: 'Usuario no encontrado' };
  return sanitize(user);
}

export async function updateProfile(id, fields) {
  const allowed = ['name', 'gender', 'weight_kg', 'height_cm', 'age', 'wake_hour', 'sleep_hour', 'timezone'];
  const clean = Object.fromEntries(
    Object.entries(fields).filter(([k]) => allowed.includes(k))
  );
  const updated = await repo.updateProfile(id, clean);
  return sanitize(updated);
}
