import React from 'react';
import { Zap } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ToastProvider';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans selection:bg-emerald-500/30 transition-colors duration-300">
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950">
            <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Zap className="text-white" size={24} />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Clusterics</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto relative scroll-smooth">
                <Dashboard />
            </div>
          </main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;