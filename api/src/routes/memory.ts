import { Router } from 'express';
import { getMemory, createMemory, toggleFavorite, deleteMemory } from '../controllers/memory';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getMemory);
router.post('/', authMiddleware, createMemory);
router.put('/:id/favorite', authMiddleware, toggleFavorite);
router.delete('/:id', authMiddleware, deleteMemory);

export default router;
