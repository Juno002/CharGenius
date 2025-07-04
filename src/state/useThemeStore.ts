import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: 'theme-dark', // Start with a default, server-safe theme
  setTheme: (theme: string) => {
    if (typeof window !== 'undefined') {
        document.documentElement.className = theme;
        localStorage.setItem('theme', theme);
    }
    set({ theme });
  },
}));
