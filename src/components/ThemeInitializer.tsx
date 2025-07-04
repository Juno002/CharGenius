"use client";
import { useThemeStore } from '@/state/useThemeStore';
import { useEffect } from 'react';

export function ThemeInitializer() {
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    // This effect runs once on the client after hydration.
    // It reads the persisted theme from localStorage and applies it.
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, [setTheme]);

  return null; // This component renders nothing.
}
