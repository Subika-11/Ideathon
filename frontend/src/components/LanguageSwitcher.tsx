import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/translate';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'اردو' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  /* ----------------------------------
     Restore language on refresh
  ---------------------------------- */
  useEffect(() => {
    const savedLang = localStorage.getItem('auto_lang');
    if (savedLang) {
      i18n.changeLanguage(savedLang);
      changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <select
        defaultValue="en"
        onChange={(e) => {
          const lang = e.target.value;
          localStorage.setItem('auto_lang', lang);
          i18n.changeLanguage(lang);
          changeLanguage(lang);
        }}
        className="
          px-3 py-2 rounded-lg shadow-lg
          bg-slate-800 text-slate-100
          border border-slate-700
          focus:outline-none focus:ring-2 focus:ring-emerald-500
        "
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
