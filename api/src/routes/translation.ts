import { Router } from 'express';
import { translate } from '../controllers/translation';

const router = Router();

router.post('/', translate);

export default router;
