const { UAParser } = require('ua-parser-js');
const geoip = require('geoip-lite');
const { detectBot } = require('./botDetector');

const extractUTM = (url) => {
  try {
    // Handling cases where url is just a path or full url
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url.startsWith('/') ? '' : '/'}${url}`;
    const parsedUrl = new URL(fullUrl);
    return {
      source: parsedUrl.searchParams.get('utm_source') || undefined,
      medium: parsedUrl.searchParams.get('utm_medium') || undefined,
      campaign: parsedUrl.searchParams.get('utm_campaign') || undefined,
    };
  } catch (error) {
    return {};
  }
};

const parseVisitorData = (ip, uaString, url, payload = {}) => {
  const parser = new UAParser(uaString);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  const geo = geoip.lookup(ip);
  const botInfo = detectBot(uaString, payload);

  return {
    device_type: device.type || 'desktop',
    browser: browser.name || 'Unknown',
    os: os.name || 'Unknown',
    country: geo ? geo.country : 'Unknown',
    city: geo ? geo.city : 'Unknown',
    utm: extractUTM(url),
    is_bot: botInfo.is_bot,
    bot_name: botInfo.bot_name,
    bot_category: botInfo.bot_category,
    threat_level: botInfo.threat_level,
  };
};

module.exports = { extractUTM, parseVisitorData };
