import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './auth/authRoutes.js';
import logsRoutes from './logs/logsRoutes.js';
import imagesRoutes from './images/imagesRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/fit/auth', authRoutes);
app.use('/fit/logs', logsRoutes);
app.use('/fit/images', imagesRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`FitApi running on port ${PORT}`));
