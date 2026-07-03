import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import translationRoutes from './src/routes/translation';
import memoryRoutes from './src/routes/memory';
import corpusRoutes from './src/routes/corpus';
import authRoutes from './src/routes/auth';
import speechRoutes from './src/routes/speech';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/translate', translationRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/corpus', corpusRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/speech', speechRoutes);

app.get('/api/health', (req: VercelRequest, res: VercelResponse) => {
  res.json({ success: true, message: 'Translation System API is running' });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}
