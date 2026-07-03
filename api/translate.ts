export default async function handler(req: any, res: any) {
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
      res.json({
        success: true,
        translation: data.trans_result[0].dst,
        sourceLang: data.from || sourceLang,
        targetLang: data.to || targetLang
      });
    } else {
      res.status(500).json({ success: false, message: data.error_msg || 'Translation failed' });
    }
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Translation failed' });
  }
}
