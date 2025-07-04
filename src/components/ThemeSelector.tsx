
'use client';
import { useThemeStore } from '@/state/useThemeStore';
import { useTranslation } from '@/context/LanguageContext';

const themes = [
  { id: 'theme-hypervisor', labelKey: 'themes.hypervisor' },
  { id: 'theme-dark', labelKey: 'themes.dark' },
  { id: 'theme-light', labelKey: 'themes.light' },
  { id: 'theme-glass-blue', labelKey: 'themes.glassBlue' },
  { id: 'theme-gold', labelKey: 'themes.gold' },
  { id: 'theme-blue', labelKey: 'themes.blue' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 p-2">
      {themes.map((tInfo) => (
        <button
          key={tInfo.id}
          onClick={() => setTheme(tInfo.id)}
          className={`px-3 py-1 rounded-md transition-all duration-300 font-semibold 
            ${theme === tInfo.id ? 'bg-primary text-primary-foreground scale-105 shadow-lg' : 'bg-muted text-muted-foreground'}`}
        >
          {t(tInfo.labelKey)}
        </button>
      ))}
    </div>
  );
}
