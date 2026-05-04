import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/requireAuth.js';

const UPLOADS_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.user.id}_${req.params.date}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

const router = Router();

// Servir imagen — sin auth porque <img src> no manda JWT
router.get('/file/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // evita path traversal
  const file = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(file)) return res.status(404).end();
  res.sendFile(file);
});

// Las rutas de abajo requieren auth
router.use(requireAuth);

// Verificar si existe imagen para una fecha
router.get('/check/:date', (req, res) => {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.startsWith(`${req.user.id}_${req.params.date}`));
  if (!files.length) return res.json({ exists: false, url: null });
  res.json({ exists: true, url: `/fit/images/file/${files[0]}` });
});

// Subir o reemplazar imagen del día
router.post('/:date', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
  res.json({ url: `/fit/images/file/${req.user.id}_${req.params.date}${ext}` });
});

// Borrar imagen del día
router.delete('/:date', (req, res) => {
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => f.startsWith(`${req.user.id}_${req.params.date}`));
  files.forEach(f => fs.unlinkSync(path.join(UPLOADS_DIR, f)));
  res.status(204).end();
});

export default router;
