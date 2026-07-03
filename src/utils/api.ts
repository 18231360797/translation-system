const BAIDU_TRANSLATE_APPID = '20260702002641662';
const BAIDU_TRANSLATE_KEY = 'HZVKuj6K3EYqVLhG06BE';
const BAIDU_SPEECH_API_KEY = 'v2jnAJkUgETflhgP3YSRJ8d2';
const BAIDU_SPEECH_SECRET_KEY = 'njhThY93AfEcuEGDg4WpuoXxcUVPUFdK';

export interface TranslationResult {
  success: boolean;
  translation: string;
  sourceLang: string;
  targetLang: string;
  message?: string;
}

export interface TranslationMemoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryListResponse {
  success: boolean;
  data: TranslationMemoryItem[];
  total: number;
  page: number;
}

export interface CorpusItem {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  category: string;
  source: string;
  example?: string;
}

export interface CorpusDetail extends CorpusItem {
  context: string;
}

export interface CorpusListResponse {
  success: boolean;
  data: CorpusItem[];
  total: number;
  page: number;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  token?: string;
}

export const translate = async (text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> => {
  try {
    const salt = Date.now().toString();
    const sign = window.crypto.subtle.digest('MD5', new TextEncoder().encode(BAIDU_TRANSLATE_APPID + text + salt + BAIDU_TRANSLATE_KEY))
      .then(hash => {
        const hexArray = Array.from(new Uint8Array(hash));
        return hexArray.map(b => b.toString(16).padStart(2, '0')).join('');
      });
    
    const signValue = await sign;
    const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(text)}&from=${sourceLang || 'auto'}&to=${targetLang || 'en'}&appid=${BAIDU_TRANSLATE_APPID}&salt=${salt}&sign=${signValue}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.trans_result && data.trans_result.length > 0) {
      return {
        success: true,
        translation: data.trans_result[0].dst,
        sourceLang: data.from || sourceLang,
        targetLang: data.to || targetLang
      };
    } else {
      return { success: false, translation: '', sourceLang, targetLang, message: data.error_msg || 'Translation failed' };
    }
  } catch (error) {
    return { success: false, translation: '', sourceLang, targetLang, message: error instanceof Error ? error.message : 'Translation failed' };
  }
};

export const speechToText = async (audio: string, lang: string): Promise<{ success: boolean; text?: string; message?: string }> => {
  try {
    const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_SPEECH_API_KEY}&client_secret=${BAIDU_SPEECH_SECRET_KEY}`, {
      method: 'POST'
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return { success: false, message: 'Failed to get access token' };
    }
    
    const speechResponse = await fetch(`https://vop.baidu.com/server_api?cuid=translation-system&token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: 'pcm',
        rate: 16000,
        channel: 1,
        len: audio.length,
        speech: audio,
        lan: lang || 'zh'
      })
    });
    const speechData = await speechResponse.json();
    
    if (speechData.err_no === 0) {
      return { success: true, text: speechData.result[0] };
    } else {
      return { success: false, message: speechData.err_msg || 'Speech recognition failed' };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Speech recognition failed' };
  }
};

export const getTranslationMemory = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  favorite?: boolean;
}): Promise<MemoryListResponse> => {
  const items = JSON.parse(localStorage.getItem('translationMemory') || '[]');
  let filtered = items;
  
  if (params?.search) {
    const search = params.search;
    filtered = filtered.filter((item: TranslationMemoryItem) => 
      item.sourceText.includes(search) || item.translatedText.includes(search)
    );
  }
  if (params?.favorite !== undefined) {
    filtered = filtered.filter((item: TranslationMemoryItem) => item.isFavorite === params.favorite);
  }
  
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    success: true,
    data: filtered.slice(start, end),
    total: filtered.length,
    page
  };
};

export const saveTranslationMemory = async (data: {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}): Promise<{ success: boolean; id: string }> => {
  const items = JSON.parse(localStorage.getItem('translationMemory') || '[]');
  const newItem: TranslationMemoryItem = {
    id: Date.now().toString(),
    ...data,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  items.unshift(newItem);
  localStorage.setItem('translationMemory', JSON.stringify(items));
  return { success: true, id: newItem.id };
};

export const toggleFavorite = async (id: string): Promise<{ success: boolean; isFavorite: boolean }> => {
  const items = JSON.parse(localStorage.getItem('translationMemory') || '[]');
  const item = items.find((i: TranslationMemoryItem) => i.id === id);
  if (item) {
    item.isFavorite = !item.isFavorite;
    item.updatedAt = new Date().toISOString();
    localStorage.setItem('translationMemory', JSON.stringify(items));
    return { success: true, isFavorite: item.isFavorite };
  }
  return { success: false, isFavorite: false };
};

export const deleteMemory = async (id: string): Promise<{ success: boolean }> => {
  const items = JSON.parse(localStorage.getItem('translationMemory') || '[]');
  const filtered = items.filter((i: TranslationMemoryItem) => i.id !== id);
  localStorage.setItem('translationMemory', JSON.stringify(filtered));
  return { success: true };
};

export const getCorpus = async (params?: {
  page?: number;
  limit?: number;
  lang?: string;
  category?: string;
  search?: string;
}): Promise<CorpusListResponse> => {
  const items = JSON.parse(localStorage.getItem('corpus') || '[]');
  let filtered = items;
  
  if (params?.lang) {
    filtered = filtered.filter((item: CorpusItem) => item.sourceLang === params.lang || item.targetLang === params.lang);
  }
  if (params?.category) {
    filtered = filtered.filter((item: CorpusItem) => item.category === params.category);
  }
  if (params?.search) {
    const search = params.search;
    filtered = filtered.filter((item: CorpusItem) => 
      item.originalText.includes(search) || item.translatedText.includes(search)
    );
  }
  
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    success: true,
    data: filtered.slice(start, end),
    total: filtered.length,
    page
  };
};

export const getCorpusDetail = async (id: string): Promise<{ success: boolean; data: CorpusDetail }> => {
  const items = JSON.parse(localStorage.getItem('corpus') || '[]');
  const item = items.find((i: CorpusItem) => i.id === id);
  if (item) {
    return { success: true, data: { ...item, context: '' } };
  }
  return { success: false, data: {} as CorpusDetail };
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  if (email === 'admin@example.com' && password === 'password') {
    const token = 'test-token-123';
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ id: '1', email }));
    return { success: true, user: { id: '1', email }, token };
  }
  return { success: false };
};

export const register = async (email: string, _password: string): Promise<AuthResponse> => {
  const token = 'test-token-123';
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({ id: '1', email }));
  return { success: true, user: { id: '1', email }, token };
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = (): { id: string; email: string } | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
