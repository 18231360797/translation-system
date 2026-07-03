import { Link, useLocation } from 'react-router-dom';
import { Globe, User, LogOut, BookOpen, History, Subtitles } from 'lucide-react';
import { useStore } from '@/stores/store';

export const Header = () => {
  const { isLoggedIn, user, logout } = useStore();
  const location = useLocation();

  const navItems = [
    { path: '/', label: '首页', icon: Globe },
    { path: '/translate', label: '翻译', icon: Globe },
    { path: '/memory', label: '翻译记忆', icon: History },
    { path: '/corpus', label: '语料库', icon: BookOpen },
    { path: '/subtitle', label: '实时字幕', icon: Subtitles },
  ];

  return (
    <header className="bg-primary-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Globe className="w-8 h-8 text-accent-400" />
            <span className="text-xl font-bold">翻译系统</span>
          </Link>

          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-accent-600 text-white'
                      : 'text-gray-300 hover:bg-primary-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="text-gray-300 hidden sm:block">{user?.email}</span>
                <button
                  onClick={logout}
                  className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-primary-700 rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">退出</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-primary-700 rounded-lg transition-all duration-200"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="flex items-center px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-all duration-200"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span>注册</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
