import { useState, useCallback, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import { Waterbody } from './types';

type Theme = 'light' | 'dark';

const getStoredTheme = (): Theme | null => {
  try {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
  } catch {
    return null;
  }
};

const applyTheme = (nextTheme: Theme) => {
  const isDark = nextTheme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', nextTheme);
  try {
    localStorage.setItem('theme', nextTheme);
  } catch {
    // Ignore storage issues and keep in-memory theme.
  }
};

function App() {
  const [selectedWaterbody, setSelectedWaterbody] = useState<Waterbody | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string>('Hillsborough');
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = getStoredTheme();
    return savedTheme ?? 'light';
  });

  useEffect(() => {
    const savedTheme = getStoredTheme();
    const initialTheme = savedTheme ?? 'light';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleWaterbodySelect = useCallback((waterbody: Waterbody) => {
    console.log('App received waterbody:', waterbody);
    setSelectedWaterbody(waterbody);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const nextTheme = prevTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      return nextTheme;
    });
  };

  return (
    <div className="flex flex-col w-full h-screen bg-slate-100 text-slate-900 dark:bg-black dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-black shadow-md z-20 px-6 py-4 border-b border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Florida Waterbody Water Quality Dashboard
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Click on any waterbody to view water quality information
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={theme === 'dark'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-zinc-800 transition"
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Content - 50/50 split on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Map - Left side on desktop, top on mobile */}
        <div className="w-full md:w-1/2 h-64 md:h-full">
          <MapComponent 
            onWaterbodySelect={handleWaterbodySelect}
            county={selectedCounty}
            onCountyChange={setSelectedCounty}
          />
        </div>

        {/* Sidebar - Right side on desktop, bottom on mobile */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto">
          <Sidebar
            waterbody={selectedWaterbody}
            onClose={() => setSelectedWaterbody(null)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
