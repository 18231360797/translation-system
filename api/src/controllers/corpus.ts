import { Request, Response } from 'express';
import { getCorpus, getCorpusDetail } from '../services/corpus';

export const getCorpusList = async (req: Request, res: Response) => {
  const { page, limit, lang, category, search } = req.query;

  try {
    const result = await getCorpus({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      lang: lang ? String(lang) : undefined,
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
    });

    res.json({
      success: true,
      data: result.data.map((item) => ({
        id: item.id,
        originalText: item.original_text,
        translatedText: item.translated_text,
        sourceLang: item.source_lang,
        targetLang: item.target_lang,
        category: item.category,
        source: item.source,
        example: item.example,
      })),
      total: result.total,
      page: result.page,
    });
  } catch (error) {
    console.error('Get corpus error:', error);
    res.status(500).json({ success: false, message: 'Failed to get corpus' });
  }
};

export const getCorpusItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await getCorpusDetail(id);

    res.json({
      success: true,
      data: {
        id: result.id,
        originalText: result.original_text,
        translatedText: result.translated_text,
        sourceLang: result.source_lang,
        targetLang: result.target_lang,
        category: result.category,
        source: result.source,
        example: result.example,
        context: result.context,
      },
    });
  } catch (error) {
    console.error('Get corpus detail error:', error);
    res.status(404).json({ success: false, message: 'Corpus not found' });
  }
};
