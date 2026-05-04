import * as service from './authService.js';

export async function register(req, res) {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function login(req, res) {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function me(req, res) {
  try {
    const user = await service.getMe(req.user.id);
    res.json(user);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const user = await service.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
