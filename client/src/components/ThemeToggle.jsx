import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { getStoredTheme, setTheme, setupSystemThemeListener } from '../utils/theme';

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Listen for OS theme changes when in 'system' mode
    const cleanup = setupSystemThemeListener(() => {
      // triggers re-render if needed
      setCurrentTheme(getStoredTheme());
    });

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      cleanup();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectTheme = (theme) => {
    setTheme(theme);
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  const getActiveIcon = () => {
    if (currentTheme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    if (currentTheme === 'dark') return <Moon className="w-4 h-4 text-emerald-400" />;
    return <Laptop className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme: ${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}`}
        className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
        aria-label="Toggle theme"
      >
        {getActiveIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Appearance
          </div>

          <button
            onClick={() => handleSelectTheme('system')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
              currentTheme === 'system'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>System</span>
            </div>
            {currentTheme === 'system' && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => handleSelectTheme('light')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
              currentTheme === 'light'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </div>
            {currentTheme === 'light' && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => handleSelectTheme('dark')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
              currentTheme === 'dark'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Dark</span>
            </div>
            {currentTheme === 'dark' && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
