import { supabase } from '../database/supabase';

export interface Corpus {
  id: string;
  original_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  category: string;
  source: string;
  example?: string;
  context?: string;
  created_at: string;
}

const corpusStore: Corpus[] = [];

const sampleData: Corpus[] = [
  {
    id: '1',
    original_text: 'Hello, how are you?',
    translated_text: '你好，你怎么样？',
    source_lang: 'en',
    target_lang: 'zh',
    category: '日常对话',
    source: 'Common Phrases',
    example: 'Hello, how are you? I am fine, thank you.',
    context: '用于日常问候的常用表达',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    original_text: 'I love learning new languages.',
    translated_text: '我喜欢学习新语言。',
    source_lang: 'en',
    target_lang: 'zh',
    category: '日常对话',
    source: 'Personal Statements',
    example: 'I love learning new languages because it opens new doors.',
    context: '表达个人兴趣和爱好',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    original_text: 'This is a beautiful day.',
    translated_text: '今天天气真好。',
    source_lang: 'en',
    target_lang: 'zh',
    category: '日常对话',
    source: 'Weather',
    example: 'This is a beautiful day, lets go outside.',
    context: '描述天气和环境',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    original_text: 'Could you please help me?',
    translated_text: '你能帮我一下吗？',
    source_lang: 'en',
    target_lang: 'zh',
    category: '日常对话',
    source: 'Requests',
    example: 'Could you please help me with this bag?',
    context: '礼貌地请求帮助',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    original_text: 'Thank you very much.',
    translated_text: '非常感谢你。',
    source_lang: 'en',
    target_lang: 'zh',
    category: '日常对话',
    source: 'Gratitude',
    example: 'Thank you very much for your help.',
    context: '表达感谢',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    original_text: 'Nice to meet you.',
    translated_text: '很高兴见到你。',
    source_lang: 'en',
    target_lang: 'zh',
    category: '日常对话',
    source: 'Introductions',
    example: 'Hi, my name is John. Nice to meet you.',
    context: '初次见面的问候',
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    original_text: 'Please find attached the report.',
    translated_text: '请查收附件中的报告。',
    source_lang: 'en',
    target_lang: 'zh',
    category: '商务交流',
    source: 'Business Email',
    example: 'Please find attached the report for your review.',
    context: '商务邮件中的常用表达',
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    original_text: 'We look forward to your response.',
    translated_text: '期待您的回复。',
    source_lang: 'en',
    target_lang: 'zh',
    category: '商务交流',
    source: 'Business Email',
    example: 'Thank you for your time. We look forward to your response.',
    context: '商务邮件结尾用语',
    created_at: new Date().toISOString(),
  },
  {
    id: '9',
    original_text: 'Let me check the availability.',
    translated_text: '让我查一下可用性。',
    source_lang: 'en',
    target_lang: 'zh',
    category: '商务交流',
    source: 'Meetings',
    example: 'Let me check the availability for next week.',
    context: '商务会议中的表达',
    created_at: new Date().toISOString(),
  },
  {
    id: '10',
    original_text: 'Could you repeat that, please?',
    translated_text: '你能再说一遍吗？',
    source_lang: 'en',
    target_lang: 'zh',
    category: '日常对话',
    source: 'Clarification',
    example: 'I did not catch that. Could you repeat that, please?',
    context: '请求对方重复',
    created_at: new Date().toISOString(),
  },
  {
    id: '11',
    original_text: 'Where is the nearest subway station?',
    translated_text: '最近的地铁站在哪里？',
    source_lang: 'en',
    target_lang: 'zh',
    category: '旅行出行',
    source: 'Travel',
    example: 'Excuse me, where is the nearest subway station?',
    context: '旅行中问路',
    created_at: new Date().toISOString(),
  },
  {
    id: '12',
    original_text: 'I would like to book a room.',
    translated_text: '我想预订一个房间。',
    source_lang: 'en',
    target_lang: 'zh',
    category: '旅行出行',
    source: 'Travel',
    example: 'I would like to book a room for two nights.',
    context: '预订酒店房间',
    created_at: new Date().toISOString(),
  },
];

export const getCorpus = async (params: {
  page?: number;
  limit?: number;
  lang?: string;
  category?: string;
  search?: string;
}) => {
  const { page = 1, limit = 20, lang, category, search } = params;

  if (!supabase) {
    let filtered = [...corpusStore];
    
    if (lang) {
      filtered = filtered.filter(
        (c) => c.source_lang === lang || c.target_lang === lang
      );
    }
    
    if (category) {
      filtered = filtered.filter((c) => c.category === category);
    }
    
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.original_text.toLowerCase().includes(search.toLowerCase()) ||
          c.translated_text.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
    };
  }

  let query = supabase
    .from('corpus')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (lang) {
    query = query.or(`source_lang.eq.${lang},target_lang.eq.${lang}`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`original_text.ilike.%${search}%,translated_text.ilike.%${search}%`);
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

export const getCorpusDetail = async (id: string) => {
  if (!supabase) {
    const data = corpusStore.find((c) => c.id === id);
    
    if (!data) {
      throw new Error('Corpus not found');
    }
    
    return data;
  }

  const { data, error } = await supabase
    .from('corpus')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Corpus not found');
  }

  return data;
};

export const seedCorpusData = async () => {
  if (corpusStore.length === 0) {
    corpusStore.push(...sampleData);
    console.log('Corpus data seeded successfully');
    return;
  }

  if (!supabase) {
    console.log('Corpus data already seeded or seeding skipped');
    return;
  }

  const { error } = await supabase.from('corpus').insert(sampleData);

  if (error) {
    console.error('Failed to seed corpus data:', error);
  } else {
    console.log('Corpus data seeded successfully');
  }
};
