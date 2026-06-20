import { useI18n, LANGS } from '../i18n/index.jsx';
export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: 'auto', padding: '9px 12px' }}>
      {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  );
}
