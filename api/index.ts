import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req: VercelRequest, res: VercelResponse) => {
  res.json({ success: true, message: 'Translation System API is running' });
});

app.post('/api/translate', async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }
    const appId = process.env.BAIDU_TRANSLATE_APPID || '';
    const key = process.env.BAIDU_TRANSLATE_KEY || '';
    const salt = Date.now().toString();
    const crypto = require('crypto');
    const sign = crypto.createHash('md5').update(appId + text + salt + key).digest('hex');
    const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(text)}&from=${sourceLang || 'auto'}&to=${targetLang || 'en'}&appid=${appId}&salt=${salt}&sign=${sign}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.trans_result && data.trans_result.length > 0) {
      res.json({ success: true, translation: data.trans_result[0].dst, sourceLang: data.from || sourceLang, targetLang: data.to || targetLang });
    } else {
      res.status(500).json({ success: false, message: data.error_msg || 'Translation failed' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Translation failed' });
  }
});

app.post('/api/speech/speech-to-text', async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { audio, lang } = req.body;
    if (!audio) {
      return res.status(400).json({ success: false, message: 'Audio data is required' });
    }
    const apiKey = process.env.BAIDU_SPEECH_API_KEY || '';
    const secretKey = process.env.BAIDU_SPEECH_SECRET_KEY || '';
    if (!apiKey || !secretKey) {
      return res.status(500).json({ success: false, message: 'Speech recognition service not configured' });
    }
    const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`, { method: 'POST' });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(500).json({ success: false, message: 'Failed to get access token' });
    }
    const speechResponse = await fetch(`https://vop.baidu.com/server_api?cuid=translation-system&token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'pcm', rate: 16000, channel: 1, len: audio.length, speech: audio, lan: lang || 'zh' })
    });
    const speechData = await speechResponse.json();
    if (speechData.err_no === 0) {
      res.json({ success: true, text: speechData.result[0] });
    } else {
      res.status(500).json({ success: false, message: speechData.err_msg || 'Speech recognition failed' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Speech recognition failed' });
  }
});

app.post('/api/auth/login', (req: VercelRequest, res: VercelResponse) => {
  const { email, password } = req.body;
  if (email === 'admin@example.com' && password === 'password') {
    res.json({ success: true, token: 'test-token-123' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/memory', (req: VercelRequest, res: VercelResponse) => {
  res.json({ success: true, data: [] });
});

app.get('/api/corpus', (req: VercelRequest, res: VercelResponse) => {
  res.json({ success: true, data: [] });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  app(req, res);
}
