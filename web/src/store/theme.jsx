import { createContext, useContext, useEffect, useState } from 'react';
const ThemeCtx = createContext();
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('bb_theme') || 'dark');
  useEffect(() => {
    localStorage.setItem('bb_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);
