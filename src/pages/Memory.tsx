import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, Trash2, ArrowRight, Calendar, Clock } from 'lucide-react';
import { useStore } from '@/stores/store';
import { getTranslationMemory, toggleFavorite, deleteMemory } from '@/utils/api';
import { TranslationMemoryItem } from '@/utils/api';
import { getLanguageName, getNativeName } from '@/utils/languages';

type FilterType = 'all' | 'favorite' | 'recent';

export const Memory = () => {
  const { isLoggedIn } = useStore();
  const navigate = useNavigate();
  const [memories, setMemories] = useState<TranslationMemoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    loadMemories();
  }, [isLoggedIn, navigate, searchTerm, filter, page]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        favorite: filter === 'favorite' ? true : undefined,
      };

      const result = await getTranslationMemory(params);
      if (result.success) {
        setMemories(result.data);
        setTotal(result.total);
      }
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const result = await toggleFavorite(id);
      if (result.success) {
        setMemories((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isFavorite: result.isFavorite } : m))
        );
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条翻译记录吗？')) return;

    try {
      const result = await deleteMemory(id);
      if (result.success) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        setTotal((prev) => prev - 1);
      }
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-primary-800 mb-6 text-center">翻译记忆库</h1>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="搜索翻译记录..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              {(['all', 'favorite', 'recent'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
                  className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                    filter === f
                      ? 'bg-primary-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'favorite' ? '收藏' : '最近'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : memories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无翻译记录</h3>
            <p className="text-gray-500 mb-6">去翻译页面进行翻译后，记录会自动保存到这里</p>
            <Link
              to="/translate"
              className="inline-flex items-center px-6 py-3 bg-primary-700 text-white rounded-xl hover:bg-primary-800 transition-colors"
            >
              去翻译
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                        {getNativeName(memory.sourceLang)} → {getNativeName(memory.targetLang)}
                      </span>
                      <span className="text-gray-400 text-sm flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(memory.createdAt)}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">原文</p>
                        <p className="text-gray-800">{memory.sourceText}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          翻译 ({getLanguageName(memory.targetLang)})
                        </p>
                        <p className="text-primary-700 font-medium">{memory.translatedText}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleFavorite(memory.id)}
                      className={`p-3 rounded-xl transition-colors ${
                        memory.isFavorite
                          ? 'text-red-500 bg-red-50 hover:bg-red-100'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title={memory.isFavorite ? '取消收藏' : '收藏'}
                    >
                      <Heart className={`w-5 h-5 ${memory.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(memory.id)}
                      className="p-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {total > 10 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                {Array.from({ length: Math.ceil(total / 10) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      page === p
                        ? 'bg-primary-700 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
