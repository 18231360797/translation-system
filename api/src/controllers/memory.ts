import { Request, Response } from 'express';
import { getTranslationMemory, createTranslationMemory, updateFavoriteStatus, deleteTranslationMemory } from '../services/memory';

export const getMemory = async (req: Request, res: Response) => {
  const { user } = req;
  const { page, limit, search, favorite } = req.query;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const result = await getTranslationMemory({
      userId: user.id,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      favorite: favorite !== undefined ? favorite === 'true' : undefined,
    });

    res.json({
      success: true,
      data: result.data.map((item) => ({
        id: item.id,
        sourceText: item.source_text,
        translatedText: item.translated_text,
        sourceLang: item.source_lang,
        targetLang: item.target_lang,
        isFavorite: item.is_favorite,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      total: result.total,
      page: result.page,
    });
  } catch (error) {
    console.error('Get memory error:', error);
    res.status(500).json({ success: false, message: 'Failed to get translation memory' });
  }
};

export const createMemory = async (req: Request, res: Response) => {
  const { user } = req;
  const { sourceText, translatedText, sourceLang, targetLang } = req.body;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!sourceText || !translatedText || !sourceLang || !targetLang) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  try {
    const result = await createTranslationMemory({
      userId: user.id,
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
    });

    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Create memory error:', error);
    res.status(500).json({ success: false, message: 'Failed to create translation memory' });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  const { user } = req;
  const { id } = req.params;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const result = await updateFavoriteStatus(id, user.id);
    res.json({ success: true, isFavorite: result.is_favorite });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle favorite' });
  }
};

export const deleteMemory = async (req: Request, res: Response) => {
  const { user } = req;
  const { id } = req.params;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await deleteTranslationMemory(id, user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete memory error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete translation memory' });
  }
};
