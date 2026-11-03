/**
 * Bot Detection Engine untuk HappyBouquet
 * Membedakan pengunjung manusia asli vs bot, crawler, scraper, dan automation tool.
 */

// Regex daftar bot mesin pencari resmi (Good Bots)
const SEARCH_ENGINE_BOTS = [
  { name: 'Googlebot', regex: /googlebot|google-inspectiontool|adsbot-google|googleother/i, category: 'search_engine', threat: 'info' },
  { name: 'Bingbot', regex: /bingbot|msnbot|bingpreview/i, category: 'search_engine', threat: 'info' },
  { name: 'Yahoo / Slurp', regex: /slurp/i, category: 'search_engine', threat: 'info' },
  { name: 'DuckDuckBot', regex: /duckduckbot/i, category: 'search_engine', threat: 'info' },
  { name: 'Baiduspider', regex: /baiduspider/i, category: 'search_engine', threat: 'info' },
  { name: 'YandexBot', regex: /yandexbot|yandeximages|yandexmetrika/i, category: 'search_engine', threat: 'info' },
  { name: 'Sogou Spider', regex: /sogou/i, category: 'search_engine', threat: 'info' },
];

// Regex bot media sosial & preview generator (Netral / Informasional)
const SOCIAL_PREVIEW_BOTS = [
  { name: 'WhatsApp Link Preview', regex: /whatsapp/i, category: 'social_preview', threat: 'info' },
  { name: 'Facebook External Hit', regex: /facebookexternalhit|facebookcatalog/i, category: 'social_preview', threat: 'info' },
  { name: 'Twitter / X Bot', regex: /twitterbot/i, category: 'social_preview', threat: 'info' },
  { name: 'Telegram Bot', regex: /telegrambot/i, category: 'social_preview', threat: 'info' },
  { name: 'Discord Bot', regex: /discordbot/i, category: 'social_preview', threat: 'info' },
  { name: 'Slackbot', regex: /slackbot|slack-imgproxy/i, category: 'social_preview', threat: 'info' },
  { name: 'LinkedIn Bot', regex: /linkedinbot/i, category: 'social_preview', threat: 'info' },
  { name: 'Pinterest Bot', regex: /pinterest/i, category: 'social_preview', threat: 'info' },
];

// Regex crawler SEO pihak ketiga (Netral / Perlu Dipantau)
const SEO_CRAWLERS = [
  { name: 'AhrefsBot', regex: /ahrefsbot/i, category: 'seo_crawler', threat: 'low' },
  { name: 'SemrushBot', regex: /semrushbot/i, category: 'seo_crawler', threat: 'low' },
  { name: 'DotBot', regex: /dotbot/i, category: 'seo_crawler', threat: 'low' },
  { name: 'MJ12bot', regex: /mj12bot/i, category: 'seo_crawler', threat: 'low' },
  { name: 'PetalBot', regex: /petalbot/i, category: 'seo_crawler', threat: 'low' },
  { name: 'Screaming Frog', regex: /screaming frog/i, category: 'seo_crawler', threat: 'low' },
];

// Regex CLI tools, HTTP Libraries, dan Headless Scrapers (Potensi Scraper / Perlu Tindakan jika spam)
const SCRAPER_AND_CLI = [
  { name: 'Python Requests / Scrapy', regex: /python-requests|aiohttp|scrapy|urllib/i, category: 'scraper_cli', threat: 'medium' },
  { name: 'cURL / Wget', regex: /curl|wget/i, category: 'scraper_cli', threat: 'medium' },
  { name: 'Postman / Insomnia', regex: /postmanruntime|insomnia/i, category: 'scraper_cli', threat: 'low' },
  { name: 'Axios / HTTP Client', regex: /axios|httpie|go-http-client|apache-httpclient|java\//i, category: 'scraper_cli', threat: 'medium' },
  { name: 'Headless Chrome / Puppeteer', regex: /headlesschrome|phantomjs|puppeteer|playwright|selenium/i, category: 'automation', threat: 'medium' },
];

// Regex Vulnerability & Security Scanners (Bahaya / Threat Tinggi)
const SECURITY_SCANNERS = [
  { name: 'Nikto Scanner', regex: /nikto/i, category: 'security_scanner', threat: 'high' },
  { name: 'SQLMap Scanner', regex: /sqlmap/i, category: 'security_scanner', threat: 'high' },
  { name: 'Nmap Scripting Engine', regex: /nmap/i, category: 'security_scanner', threat: 'high' },
  { name: 'Acunetix Scanner', regex: /acunetix/i, category: 'security_scanner', threat: 'high' },
  { name: 'Zgrab / Censys / Shodan', regex: /zgrab|censys|shodan/i, category: 'security_scanner', threat: 'high' },
  { name: 'Masscan / Port Scanner', regex: /masscan/i, category: 'security_scanner', threat: 'high' },
];

// Gabungan pola bot generik
const GENERIC_BOT_REGEX = /bot|crawler|spider|crawl|slurp|archiver|transcoder/i;

/**
 * Mendeteksi apakah request berasal dari bot, dan menentukan kategorinya.
 * @param {string} uaString User-Agent header
 * @param {object} payload Payload dari client (misal is_webdriver)
 * @returns {object} { is_bot: boolean, bot_name: string|null, bot_category: string|null, threat_level: string|null }
 */
const detectBot = (uaString = '', payload = {}) => {
  const ua = String(uaString || '').trim();

  // 1. Cek User-Agent kosong atau mencurigakan
  if (!ua) {
    return {
      is_bot: true,
      bot_name: 'Suspicious (Empty User-Agent)',
      bot_category: 'scraper_cli',
      threat_level: 'medium',
    };
  }

  // 2. Cek sinyal automation langsung dari browser (WebDriver / Puppeteer)
  if (payload.is_webdriver === true || payload.is_automation === true) {
    return {
      is_bot: true,
      bot_name: 'Automated Browser (WebDriver)',
      bot_category: 'automation',
      threat_level: 'medium',
    };
  }

  // 3. Cek Security Scanners (Threat Tinggi)
  for (const bot of SECURITY_SCANNERS) {
    if (bot.regex.test(ua)) {
      return { is_bot: true, bot_name: bot.name, bot_category: bot.category, threat_level: bot.threat };
    }
  }

  // 4. Cek Mesin Pencari Resmi (Good Bots)
  for (const bot of SEARCH_ENGINE_BOTS) {
    if (bot.regex.test(ua)) {
      return { is_bot: true, bot_name: bot.name, bot_category: bot.category, threat_level: bot.threat };
    }
  }

  // 5. Cek Media Sosial / Link Preview
  for (const bot of SOCIAL_PREVIEW_BOTS) {
    if (bot.regex.test(ua)) {
      return { is_bot: true, bot_name: bot.name, bot_category: bot.category, threat_level: bot.threat };
    }
  }

  // 6. Cek SEO Crawlers
  for (const bot of SEO_CRAWLERS) {
    if (bot.regex.test(ua)) {
      return { is_bot: true, bot_name: bot.name, bot_category: bot.category, threat_level: bot.threat };
    }
  }

  // 7. Cek Scraper & CLI Tools
  for (const bot of SCRAPER_AND_CLI) {
    if (bot.regex.test(ua)) {
      return { is_bot: true, bot_name: bot.name, bot_category: bot.category, threat_level: bot.threat };
    }
  }

  // 8. Cek kata kunci bot umum
  if (GENERIC_BOT_REGEX.test(ua)) {
    return {
      is_bot: true,
      bot_name: 'Generic Web Crawler / Bot',
      bot_category: 'scraper_cli',
      threat_level: 'low',
    };
  }

  // Bukan bot (Real Human Visitor)
  return {
    is_bot: false,
    bot_name: null,
    bot_category: null,
    threat_level: null,
  };
};

module.exports = {
  detectBot,
  SEARCH_ENGINE_BOTS,
  SOCIAL_PREVIEW_BOTS,
  SEO_CRAWLERS,
  SCRAPER_AND_CLI,
  SECURITY_SCANNERS,
};
