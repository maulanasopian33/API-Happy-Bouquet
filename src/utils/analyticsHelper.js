const { UAParser } = require('ua-parser-js');
const geoip = require('geoip-lite');

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

const parseVisitorData = (ip, uaString, url) => {
  const parser = new UAParser(uaString);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  const geo = geoip.lookup(ip);

  return {
    device_type: device.type || 'desktop',
    browser: browser.name || 'Unknown',
    os: os.name || 'Unknown',
    country: geo ? geo.country : 'Unknown',
    city: geo ? geo.city : 'Unknown',
    utm: extractUTM(url)
  };
};

module.exports = { extractUTM, parseVisitorData };
