// Recognise automated visitors by their User-Agent so they do not cause database writes (view counters).
// Search-engine crawlers are deliberately included: Googlebot renders pages with JavaScript, so it would otherwise
// "view" every page it fetches. A missing User-Agent is treated as a bot too: real browsers always send one.
const BOT_PATTERN = new RegExp(
  [
    'bot', 'crawl', 'spider', 'slurp', 'scrape', 'fetch', 'preview', 'lighthouse', 'pagespeed', 'headless', 'phantom',
    'puppeteer', 'playwright', 'selenium', 'python', 'curl', 'wget', 'libwww', 'httpclient', 'okhttp', 'java/', 'go-http',
    'node-fetch', 'axios', 'monitor', 'uptime', 'pingdom', 'statuscake', 'datadog', 'newrelic', 'facebookexternalhit',
    'whatsapp', 'telegram', 'discord', 'embedly', 'quora', 'pinterest', 'google-', 'googleother', 'apis-google',
    'adsbot', 'mediapartners', 'bingpreview', 'yandex', 'baidu', 'duckduck', 'semrush', 'ahrefs', 'mj12', 'dotbot',
    'petalbot', 'bytespider', 'gptbot', 'claudebot', 'ccbot', 'amazonbot', 'applebot', 'chrome-lighthouse',
  ].join('|'),
  'i'
);

export function isBot(userAgent) {
  if (!userAgent || userAgent.length < 10) return true;
  return BOT_PATTERN.test(userAgent);
}
