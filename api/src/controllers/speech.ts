import { Request, Response } from 'express';
import { recognizeSpeech, recognizeSpeechWithLang } from '../services/speech';

export const speechToText = async (req: Request, res: Response) => {
  try {
    const { audio, lang } = req.body;

    if (!audio) {
      return res.status(400).json({ success: false, message: 'Audio data is required' });
    }

    const audioBuffer = Buffer.from(audio, 'base64');
    
    let text: string;
    if (lang) {
      text = await recognizeSpeechWithLang(audioBuffer, lang);
    } else {
      text = await recognizeSpeech(audioBuffer);
    }

    res.json({ success: true, text });
  } catch (error) {
    console.error('Speech recognition error:', error);
    
    let message = error instanceof Error ? error.message : 'Speech recognition failed';
    
    if (message.includes('not configured')) {
      res.status(500).json({ 
        success: false, 
        message: 'Speech recognition service not configured. Please set BAIDU_SPEECH_API_KEY and BAIDU_SPEECH_SECRET_KEY in .env file.' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: message 
      });
    }
  }
};
