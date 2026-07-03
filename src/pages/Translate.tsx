import { useState, useEffect } from 'react';
import { Copy, Volume2, Heart, RefreshCw, Check } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useStore } from '@/stores/store';
import { translate, saveTranslationMemory, toggleFavorite } from '@/utils/api';
import { getLanguageName, getNativeName } from '@/utils/languages';

export const Translate = () => {
  const { translation, setTranslation, isLoggedIn } = useStore();
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!translation.sourceText.trim()) return;

    setTranslation({ isTranslating: true, error: null });

    try {
      const result = await translate(
        translation.sourceText,
        translation.sourceLang,
        translation.targetLang
      );

      if (result.success) {
        setTranslation({
          translatedText: result.translation,
          sourceLang: result.sourceLang,
          isTranslating: false,
        });

        if (isLoggedIn) {
          const saved = await saveTranslationMemory({
            sourceText: translation.sourceText,
            translatedText: result.translation,
            sourceLang: result.sourceLang,
            targetLang: translation.targetLang,
          });
          if (saved.success) {
            setFavoriteId(saved.id);
          }
        }
      } else {
        setTranslation({ error: '翻译失败，请重试', isTranslating: false });
      }
    } catch (error) {
      setTranslation({ error: '网络错误，请检查连接', isTranslating: false });
    }
  };

  const handleSwapLanguages = () => {
    setTranslation({
      sourceLang: translation.targetLang,
      targetLang: translation.sourceLang,
      sourceText: translation.translatedText,
      translatedText: translation.sourceText,
    });
    setIsFavorite(false);
    setFavoriteId(null);
  };

  const handleCopy = async () => {
    if (translation.translatedText) {
      await navigator.clipboard.writeText(translation.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = () => {
    if (translation.translatedText) {
      const utterance = new SpeechSynthesisUtterance(translation.translatedText);
      utterance.lang = translation.targetLang;
      speechSynthesis.speak(utterance);
    }
  };

  const handleFavorite = async () => {
    if (!isLoggedIn || !favoriteId) return;

    try {
      const result = await toggleFavorite(favoriteId);
      if (result.success) {
        setIsFavorite(result.isFavorite);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleTranslate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [translation.sourceText]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-primary-800 mb-6 text-center">文本翻译</h1>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <LanguageSelector
                  value={translation.sourceLang}
                  onChange={(value) => setTranslation({ sourceLang: value })}
                  className="flex-1 mr-4"
                />
                <button
                  onClick={handleSwapLanguages}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  title="交换语言"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
                <LanguageSelector
                  value={translation.targetLang}
                  onChange={(value) => setTranslation({ targetLang: value })}
                  className="flex-1 ml-4"
                />
              </div>

              <div className="relative">
                <textarea
                  value={translation.sourceText}
                  onChange={(e) => setTranslation({ sourceText: e.target.value })}
                  placeholder="输入需要翻译的文本..."
                  className="w-full h-64 px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none text-lg"
                />
                <div className="absolute bottom-3 right-3">
                  <span className="text-sm text-gray-400">
                    {translation.sourceText.length} 字
                  </span>
                </div>
              </div>

              <button
                onClick={handleTranslate}
                disabled={!translation.sourceText.trim() || translation.isTranslating}
                className="w-full mt-4 px-6 py-3 bg-primary-700 text-white rounded-xl hover:bg-primary-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
              >
                {translation.isTranslating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    翻译中...
                  </>
                ) : (
                  '翻译'
                )}
              </button>
            </div>

            <div className="flex-1 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-gray-700">
                  {getNativeName(translation.targetLang)} ({getLanguageName(translation.targetLang)})
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleFavorite}
                    disabled={!isLoggedIn || !favoriteId}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorite
                        ? 'text-red-500 bg-red-50'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30'
                    }`}
                    title={isLoggedIn ? '收藏' : '登录后可收藏'}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!translation.translatedText}
                    className={`p-2 rounded-lg transition-colors ${
                      copied
                        ? 'text-green-500 bg-green-50'
                        : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 disabled:opacity-30'
                    }`}
                    title="复制"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleSpeak}
                    disabled={!translation.translatedText}
                    className="p-2 rounded-lg text-gray-400 hover:text-accent-500 hover:bg-accent-50 disabled:opacity-30 transition-colors"
                    title="发音"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="w-full h-64 px-4 py-4 border border-gray-300 rounded-xl bg-white overflow-auto text-lg">
                  {translation.isTranslating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : translation.error ? (
                    <p className="text-red-500">{translation.error}</p>
                  ) : translation.translatedText ? (
                    <p className="text-gray-800 whitespace-pre-wrap">{translation.translatedText}</p>
                  ) : (
                    <p className="text-gray-400">翻译结果将显示在这里...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-primary-800 mb-4">使用提示</h2>
          <ul className="text-gray-600 space-y-2">
            <li>• 输入文本后点击翻译按钮或按 Ctrl+Enter 进行翻译</li>
            <li>• 点击交换按钮可以快速切换源语言和目标语言</li>
            <li>• 登录后可以收藏翻译结果到翻译记忆库</li>
            <li>• 支持100+种语言互译，源语言可选择自动检测</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
