import express from 'express';
import cors from 'cors';
import translationRoutes from './routes/translation';
import memoryRoutes from './routes/memory';
import corpusRoutes from './routes/corpus';
import authRoutes from './routes/auth';
import speechRoutes from './routes/speech';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/translate', translationRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/corpus', corpusRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/speech', speechRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Translation System API is running' });
});

export default app;
