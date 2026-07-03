const API_BASE_URL = '/api';

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
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });
  return response.json();
};

export const getTranslationMemory = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  favorite?: boolean;
}): Promise<MemoryListResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.search) query.set('search', params.search);
  if (params?.favorite !== undefined) query.set('favorite', params.favorite.toString());

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/memory?${query}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  return response.json();
};

export const saveTranslationMemory = async (data: {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}): Promise<{ success: boolean; id: string }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/memory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const toggleFavorite = async (id: string): Promise<{ success: boolean; isFavorite: boolean }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/memory/${id}/favorite`, {
    method: 'PUT',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  return response.json();
};

export const deleteMemory = async (id: string): Promise<{ success: boolean }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/memory/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  return response.json();
};

export const getCorpus = async (params?: {
  page?: number;
  limit?: number;
  lang?: string;
  category?: string;
  search?: string;
}): Promise<CorpusListResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.lang) query.set('lang', params.lang);
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);

  const response = await fetch(`${API_BASE_URL}/corpus?${query}`);
  return response.json();
};

export const getCorpusDetail = async (id: string): Promise<{ success: boolean; data: CorpusDetail }> => {
  const response = await fetch(`${API_BASE_URL}/corpus/${id}`);
  return response.json();
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const register = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = (): { id: string; email: string } | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
