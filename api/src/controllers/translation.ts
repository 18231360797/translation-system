import { Request, Response } from 'express';
import { translateText } from '../services/translation';

export const translate = async (req: Request, res: Response) => {
  const { text, sourceLang, targetLang } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  try {
    const result = await translateText(text, sourceLang || 'auto', targetLang);
    res.json(result);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ success: false, message: 'Translation failed' });
  }
};
