import { supabase } from '../database/supabase';

export interface TranslationMemory {
  id: string;
  user_id: string;
  source_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

const memoryStore: TranslationMemory[] = [];

export const getTranslationMemory = async (params: {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  favorite?: boolean;
}) => {
  const { userId, page = 1, limit = 20, search, favorite } = params;

  if (!supabase) {
    let filtered = memoryStore.filter((m) => m.user_id === userId);
    
    if (search) {
      filtered = filtered.filter(
        (m) =>
          m.source_text.toLowerCase().includes(search.toLowerCase()) ||
          m.translated_text.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (favorite !== undefined) {
      filtered = filtered.filter((m) => m.is_favorite === favorite);
    }
    
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
    };
  }

  let query = supabase
    .from('translation_memory')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`source_text.ilike.%${search}%,translated_text.ilike.%${search}%`);
  }

  if (favorite !== undefined) {
    query = query.eq('is_favorite', favorite);
  }

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    page,
  };
};

export const createTranslationMemory = async (data: {
  userId: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}) => {
  const { userId, sourceText, translatedText, sourceLang, targetLang } = data;

  if (!supabase) {
    const newMemory: TranslationMemory = {
      id: Date.now().toString(),
      user_id: userId,
      source_text: sourceText,
      translated_text: translatedText,
      source_lang: sourceLang,
      target_lang: targetLang,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.push(newMemory);
    return newMemory;
  }

  const { data: result, error } = await supabase
    .from('translation_memory')
    .insert([
      {
        user_id: userId,
        source_text: sourceText,
        translated_text: translatedText,
        source_lang: sourceLang,
        target_lang: targetLang,
        is_favorite: false,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
};

export const updateFavoriteStatus = async (id: string, userId: string) => {
  if (!supabase) {
    const memory = memoryStore.find((m) => m.id === id && m.user_id === userId);
    
    if (!memory) {
      throw new Error('Memory not found');
    }
    
    memory.is_favorite = !memory.is_favorite;
    memory.updated_at = new Date().toISOString();
    
    return memory;
  }

  const { data: memory, error: fetchError } = await supabase
    .from('translation_memory')
    .select('is_favorite')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (!memory) {
    throw new Error('Memory not found');
  }

  const { data: result, error } = await supabase
    .from('translation_memory')
    .update({ is_favorite: !memory.is_favorite })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
};

export const deleteTranslationMemory = async (id: string, userId: string) => {
  if (!supabase) {
    const index = memoryStore.findIndex((m) => m.id === id && m.user_id === userId);
    
    if (index === -1) {
      throw new Error('Memory not found');
    }
    
    memoryStore.splice(index, 1);
    return;
  }

  const { error } = await supabase
    .from('translation_memory')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
};
