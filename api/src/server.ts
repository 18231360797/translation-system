import app from './app';
import dotenv from 'dotenv';
import { seedCorpusData } from './services/corpus';

dotenv.config();

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await seedCorpusData();
  } catch (error) {
    console.log('Corpus data already seeded or seeding skipped');
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
