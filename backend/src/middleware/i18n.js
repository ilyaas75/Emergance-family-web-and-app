const path = require('path');
const env = require('../config/env');
const SUPPORTED = ['so', 'ar', 'en'];
const dict = {};
for (const l of SUPPORTED) dict[l] = require(path.join('../locales', l + '.json'));

function resolve(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
}
// Picks language from ?lang -> x-lang header -> Accept-Language -> default.
module.exports = function i18n(req, res, next) {
  let lang = (req.query.lang || req.headers['x-lang'] || '').toLowerCase();
  if (!SUPPORTED.includes(lang)) {
    const al = (req.headers['accept-language'] || '').toLowerCase();
    lang = SUPPORTED.find(l => al.includes(l)) || env.defaultLang;
  }
  req.lang = lang;
  res.setHeader('Content-Language', lang);
  req.t = (key, params = {}) => {
    let msg = resolve(dict[lang], key) || resolve(dict[env.defaultLang], key) || key;
    Object.keys(params).forEach(p => { msg = msg.replace(`{${p}}`, params[p]); });
    return msg;
  };
  next();
};
