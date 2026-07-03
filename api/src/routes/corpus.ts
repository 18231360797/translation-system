import { Router } from 'express';
import { getCorpusList, getCorpusItem } from '../controllers/corpus';

const router = Router();

router.get('/', getCorpusList);
router.get('/:id', getCorpusItem);

export default router;
