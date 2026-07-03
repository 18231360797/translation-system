import { create } from 'zustand';

interface User {
  id: string;
  email: string;
}

interface TranslationState {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isTranslating: boolean;
  error: string | null;
}

interface StoreState {
  user: User | null;
  isLoggedIn: boolean;
  translation: TranslationState;
  setUser: (user: User | null) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setTranslation: (state: Partial<TranslationState>) => void;
  resetTranslation: () => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  isLoggedIn: false,
  translation: {
    sourceText: '',
    translatedText: '',
    sourceLang: 'auto',
    targetLang: 'zh',
    isTranslating: false,
    error: null,
  },
  setUser: (user) => set({ user }),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isLoggedIn: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isLoggedIn: false });
  },
  setTranslation: (state) =>
    set((prev) => ({
      translation: { ...prev.translation, ...state },
    })),
  resetTranslation: () =>
    set({
      translation: {
        sourceText: '',
        translatedText: '',
        sourceLang: 'auto',
        targetLang: 'zh',
        isTranslating: false,
        error: null,
      },
    }),
}));
