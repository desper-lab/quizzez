import React, { useEffect, useState } from 'react';
import { QuizFlow } from './components/quiz/QuizFlow';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Check, Copy, Moon, Sun } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'quiz' | 'admin'>('quiz');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync view with URL pathname and search parameters
  useEffect(() => {
    const syncRouteFromLocation = () => {
      const path = window.location.pathname;
      const search = new URLSearchParams(window.location.search);
      if (path === '/admin' || search.get('view') === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('quiz');
      }
    };

    syncRouteFromLocation();
    window.addEventListener('popstate', syncRouteFromLocation);
    return () => window.removeEventListener('popstate', syncRouteFromLocation);
  }, []);

  // Update theme class on root element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const navigateTo = (view: 'quiz' | 'admin') => {
    setCurrentView(view);
    const targetPath = view === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const handleShareQuiz = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Bar Contract (Zone 1: Wordmark, Zone 2: Nav, Zone 3: Primary Action) */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('quiz')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 hover:opacity-90 cursor-pointer"
          >
            ArchetypeQuiz
          </button>

          {/* Zone 2: Nav Links */}
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => navigateTo('quiz')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'quiz' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
              }`}
            >
              Take Quiz
            </button>
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'admin' ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''
              }`}
            >
              Admin Dashboard
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleShareQuiz}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied' : 'Share Quiz'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center">
        {currentView === 'quiz' ? (
          <QuizFlow onOpenAdmin={() => navigateTo('admin')} />
        ) : (
          <AdminDashboard onBackToQuiz={() => navigateTo('quiz')} />
        )}
      </main>

      {/* Clean Uncluttered Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personality Assessment · 10 Questions</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
            >
              Admin Results (/admin)
            </button>
            <span aria-hidden="true">·</span>
            <span>Local JSON DB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
