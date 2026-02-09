import React, { createContext, useContext, useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'light';
    }
    return 'light';
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const getSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = (newTheme: 'light' | 'dark') => {
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      setResolvedTheme(newTheme);
    };

    if (theme === 'system') {
      applyTheme(getSystemTheme());
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme(getSystemTheme());
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
      title={`Theme: ${theme}`}
    >
      {theme === 'light' && <Sun className="w-5 h-5" />}
      {theme === 'dark' && <Moon className="w-5 h-5" />}
      {theme === 'system' && <Monitor className="w-5 h-5" />}
    </button>
  );
};

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'light' 
            ? 'bg-white dark:bg-slate-700 shadow-sm text-yellow-500' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'dark' 
            ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'system' 
            ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' 
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title="System preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ThemeProvider;
