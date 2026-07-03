import crypto from 'crypto';

export interface TranslationResult {
  success: boolean;
  translation: string;
  sourceLang: string;
  targetLang: string;
  message?: string;
}

const langCodeMap: Record<string, string> = {
  'auto': 'auto',
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'cht',
  'zh-HK': 'cht',
  'en': 'en',
  'ja': 'jp',
  'ko': 'kor',
  'fr': 'fra',
  'de': 'de',
  'es': 'spa',
  'ru': 'ru',
  'pt': 'pt',
  'it': 'it',
  'ar': 'ara',
  'hi': 'hi',
  'th': 'th',
  'vi': 'vie',
  'id': 'id',
  'ms': 'ms',
  'tl': 'tl',
  'fil': 'tl',
  'tr': 'tr',
  'nl': 'nl',
  'sv': 'sv',
  'da': 'da',
  'no': 'no',
  'fi': 'fi',
  'pl': 'pl',
  'cs': 'cs',
  'hu': 'hu',
  'ro': 'ro',
  'bg': 'bg',
  'el': 'el',
  'he': 'iw',
  'ur': 'ur',
  'fa': 'fa',
};

const mapLangCode = (code: string): string => {
  return langCodeMap[code] || code;
};

const BAIDU_TRANSLATE_API = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

const generateSalt = (): string => {
  return Date.now().toString();
};

const generateSign = (appid: string, q: string, salt: string, key: string): string => {
  const str = `${appid}${q}${salt}${key}`;
  return crypto.createHash('md5').update(str).digest('hex');
};

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> => {
  const appid = process.env.BAIDU_TRANSLATE_APPID || '';
  const key = process.env.BAIDU_TRANSLATE_KEY || '';

  if (!appid || !key) {
    return {
      success: false,
      translation: '',
      sourceLang,
      targetLang,
      message: 'Baidu Translate API credentials not configured',
    };
  }

  const mappedSourceLang = mapLangCode(sourceLang);
  const mappedTargetLang = mapLangCode(targetLang);
  const salt = generateSalt();
  const sign = generateSign(appid, text, salt, key);

  const params = new URLSearchParams({
    q: text,
    from: mappedSourceLang,
    to: mappedTargetLang,
    appid,
    salt,
    sign,
  });

  try {
    const response = await fetch(`${BAIDU_TRANSLATE_API}?${params}`, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error_code) {
      throw new Error(`Translation error: ${result.error_msg || result.error_code} (code: ${result.error_code})`);
    }

    if (result.trans_result && result.trans_result.length > 0) {
      const translations = result.trans_result.map((item: { dst: string }) => item.dst);
      return {
        success: true,
        translation: translations.join('\n'),
        sourceLang: result.from || mappedSourceLang,
        targetLang: result.to || mappedTargetLang,
      };
    } else {
      throw new Error('No translation returned');
    }
  } catch (error) {
    console.error('Translation error:', error);

    if (error instanceof Error) {
      return {
        success: false,
        translation: '',
        sourceLang,
        targetLang,
        message: error.message,
      };
    }

    return {
      success: false,
      translation: '',
      sourceLang,
      targetLang,
      message: 'Translation failed',
    };
  }
};
