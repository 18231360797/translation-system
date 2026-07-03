import { Router } from 'express';
import { speechToText } from '../controllers/speech';

const router = Router();

router.post('/speech-to-text', speechToText);

export default router;
