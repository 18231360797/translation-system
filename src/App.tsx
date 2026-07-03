import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Home } from '@/pages/Home';
import { Translate } from '@/pages/Translate';
import { Memory } from '@/pages/Memory';
import { Corpus } from '@/pages/Corpus';
import { Subtitle } from '@/pages/Subtitle';
import { LoginPage } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { useStore } from '@/stores/store';
import { getCurrentUser } from '@/utils/api';

function App() {
  const { setUser, setIsLoggedIn } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUser(user);
      setIsLoggedIn(true);
    }
    setIsInitializing(false);
  }, [setUser, setIsLoggedIn]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const authRoutes = [
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <Register /> },
  ];

  const mainRoutes = [
    { path: '/', element: <Home /> },
    { path: '/translate', element: <Translate /> },
    { path: '/memory', element: <Memory /> },
    { path: '/corpus', element: <Corpus /> },
    { path: '/subtitle', element: <Subtitle /> },
  ];

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <Routes>
            {authRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
            {mainRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
