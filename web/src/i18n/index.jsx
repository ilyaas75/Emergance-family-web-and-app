import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from './translations';

const I18nCtx = createContext();
export const LANGS = [ { code: 'so', label: 'Soomaali' }, { code: 'ar', label: 'العربية' }, { code: 'en', label: 'English' } ];

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem('bb_lang') || 'so');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('bb_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  // t('nav.dashboard') -> nested lookup with fallback to English then key
  const t = (path) => {
    const get = (obj) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
    return get(translations[lang]) ?? get(translations.en) ?? path;
  };
  const setLang = (l) => setLangState(l);
  return <I18nCtx.Provider value={{ lang, setLang, dir, t }}>{children}</I18nCtx.Provider>;
}
export const useI18n = () => useContext(I18nCtx);
