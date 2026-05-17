import express from 'express';
import cors from 'cors';
import authRoutes from './auth/authRoutes.js';
import logsRoutes from './logs/logsRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/fit/auth', authRoutes);
app.use('/fit/logs', logsRoutes);

// Imágenes deshabilitadas en Vercel (sin sistema de archivos persistente)
app.all('/fit/images*', (_, res) => {
  res.status(503).json({ error: 'Las imágenes solo están disponibles en modo local' });
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

export default app;
