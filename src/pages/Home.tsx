import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, BookOpen, History, Subtitles, Sparkles } from 'lucide-react';
import { languages, popularLanguages, getNativeName } from '@/utils/languages';
import { useStore } from '@/stores/store';

export const Home = () => {
  const [quickText, setQuickText] = useState('');
  const [targetLang, setTargetLang] = useState('zh');
  const navigate = useNavigate();
  const setTranslation = useStore((state) => state.setTranslation);

  const handleQuickTranslate = () => {
    if (quickText.trim()) {
      setTranslation({ sourceText: quickText, targetLang });
      navigate('/translate');
    }
  };

  const features = [
    {
      icon: Globe,
      title: '多语种翻译',
      description: '支持100+种语言互译，智能识别源语言',
      color: 'bg-blue-500',
      path: '/translate',
    },
    {
      icon: History,
      title: '翻译记忆',
      description: '自动保存翻译历史，随时回顾和收藏',
      color: 'bg-green-500',
      path: '/memory',
    },
    {
      icon: BookOpen,
      title: '语料库',
      description: '丰富的例句库，学习地道表达',
      color: 'bg-purple-500',
      path: '/corpus',
    },
    {
      icon: Subtitles,
      title: '实时字幕',
      description: '语音转文字并实时翻译，即时交流无障碍',
      color: 'bg-orange-500',
      path: '/subtitle',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md mb-6">
            <Sparkles className="w-4 h-4 text-accent-500 mr-2" />
            <span className="text-sm text-gray-600">全新升级，体验更佳</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-primary-800 mb-6">
            打破语言壁垒
            <br />
            <span className="text-accent-600">轻松沟通世界</span>
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            专业的多语种翻译系统，为语言学习者提供准确的对照翻译，支持翻译记忆、语料库和实时字幕功能。
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <textarea
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  placeholder="输入需要翻译的文本..."
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none h-24"
                  onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleQuickTranslate()}
                />
                <span className="absolute bottom-3 right-3 text-sm text-gray-400">Ctrl+Enter 翻译</span>
              </div>
              <div className="flex flex-col gap-3">
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                >
                  {languages.filter((l) => l.code !== 'auto').map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleQuickTranslate}
                  className="flex items-center justify-center px-6 py-3 bg-primary-700 text-white rounded-xl hover:bg-primary-800 transition-colors font-medium"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  翻译
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="text-sm text-gray-500">热门语种：</span>
            {popularLanguages.filter((l) => l !== 'auto').map((lang) => (
              <button
                key={lang}
                onClick={() => setTargetLang(lang)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  targetLang === lang
                    ? 'bg-primary-700 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {getNativeName(lang)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-800 mb-12">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  to={feature.path}
                  className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-primary-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">开始您的翻译之旅</h2>
          <p className="text-gray-300 mb-8">注册账号，解锁更多功能，体验个性化翻译服务</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-colors font-medium"
            >
              免费注册
            </Link>
            <Link
              to="/translate"
              className="px-8 py-3 bg-white text-primary-800 rounded-xl hover:bg-gray-100 transition-colors font-medium"
            >
              立即翻译
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
