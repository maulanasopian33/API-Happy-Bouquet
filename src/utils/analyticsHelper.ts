import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface AnalyticsPayload {
  session_id: string;
  url: string;
  referrer?: string;
  event_type: 'pageview' | 'scroll' | 'exit' | 'custom';
  scroll_depth?: number;
  ip_address: string;
  user_agent: string;
}

export interface ParsedAnalyticsData {
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  utm: UTMParams;
}

export const extractUTM = (url: string): UTMParams => {
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

export const parseVisitorData = (ip: string, uaString: string, url: string): ParsedAnalyticsData => {
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
