import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle, lang = 'hi' }) {
  const isDark = theme === 'dark';
  const label = lang === 'hi'
    ? (isDark ? 'लाइट मोड चालू करें' : 'डार्क मोड चालू करें')
    : (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');

  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      className="theme-toggle-btn"
      id="theme-toggle-button"
    >
      <div className="theme-toggle-icon-wrap">
        {isDark ? (
          <Sun size={18} className="theme-icon sun-icon" />
        ) : (
          <Moon size={18} className="theme-icon moon-icon" />
        )}
      </div>
    </button>
  );
}
