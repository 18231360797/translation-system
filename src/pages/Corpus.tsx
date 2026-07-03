import { useState, useEffect } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { getCorpus, getCorpusDetail } from '@/utils/api';
import { CorpusItem, CorpusDetail } from '@/utils/api';
import { getLanguageName, getNativeName } from '@/utils/languages';

const categories = ['全部', '日常对话', '商务交流', '旅行出行', '学术研究', '影视娱乐'];

export const Corpus = () => {
  const [corpusList, setCorpusList] = useState<CorpusItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('全部');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CorpusDetail | null>(null);

  useEffect(() => {
    loadCorpus();
  }, [searchTerm, category, page]);

  const loadCorpus = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        search: searchTerm || undefined,
        category: category === '全部' ? undefined : category,
      };

      const result = await getCorpus(params);
      if (result.success) {
        setCorpusList(result.data);
        setTotal(result.total);
      }
    } catch (error) {
      console.error('Failed to load corpus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const result = await getCorpusDetail(id);
      if (result.success) {
        setSelectedItem(result.data);
      }
    } catch (error) {
      console.error('Failed to load corpus detail:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-primary-800 mb-6 text-center">语料库</h1>

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
                placeholder="搜索例句..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : corpusList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无语料</h3>
            <p className="text-gray-500">尝试更换搜索关键词或分类筛选</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corpusList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => handleViewDetail(item.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                    {item.category}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {getNativeName(item.sourceLang)} → {getNativeName(item.targetLang)}
                  </span>
                </div>
                <p className="text-gray-800 font-medium mb-2 line-clamp-2">{item.originalText}</p>
                <p className="text-gray-600 text-sm line-clamp-2">{item.translatedText}</p>
                {item.source && (
                  <p className="text-gray-400 text-xs mt-3">来源: {item.source}</p>
                )}
                <div className="mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-accent-600 text-sm font-medium">查看详情 →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > 12 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            {Array.from({ length: Math.ceil(total / 12) }, (_, i) => i + 1).map((p) => (
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

      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-800">语料详情</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-xl font-medium">
                  {getNativeName(selectedItem.sourceLang)} → {getNativeName(selectedItem.targetLang)}
                </span>
                <span className="px-4 py-2 bg-accent-100 text-accent-700 rounded-xl font-medium">
                  {selectedItem.category}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">原文</h3>
                <p className="text-xl text-gray-800">{selectedItem.originalText}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  翻译 ({getLanguageName(selectedItem.targetLang)})
                </h3>
                <p className="text-xl text-primary-700 font-medium">{selectedItem.translatedText}</p>
              </div>

              {selectedItem.example && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">例句</h3>
                  <p className="text-gray-700">{selectedItem.example}</p>
                </div>
              )}

              {selectedItem.context && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">背景说明</h3>
                  <p className="text-gray-600">{selectedItem.context}</p>
                </div>
              )}

              {selectedItem.source && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">来源</h3>
                  <p className="text-gray-400 text-sm">{selectedItem.source}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
