import app from './src/app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
