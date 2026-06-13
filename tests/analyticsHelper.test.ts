import { extractUTM, parseVisitorData } from '../src/utils/analyticsHelper';

describe('Analytics Helper', () => {
  describe('extractUTM', () => {
    it('should successfully extract UTM parameters from a valid URL (skenario sukses)', () => {
      const url = 'https://example.com/product?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_sale';
      const result = extractUTM(url);
      
      expect(result).toEqual({
        source: 'facebook',
        medium: 'cpc',
        campaign: 'summer_sale'
      });
    });

    it('should return empty object when UTM parameters are missing or URL is invalid (skenario gagal)', () => {
      // Missing UTM params
      const url1 = 'https://example.com/product';
      expect(extractUTM(url1)).toEqual({
        source: undefined,
        medium: undefined,
        campaign: undefined
      });

      // Invalid URL string that cannot be parsed
      const resultInvalid = extractUTM('not a valid url format!');
      expect(resultInvalid).toEqual({});
    });
  });

  describe('parseVisitorData', () => {
    it('should successfully parse User-Agent and GeoIP data (skenario sukses)', () => {
      // Mocking an IP that belongs to the US (e.g. Google Public DNS)
      const ip = '8.8.8.8'; 
      const uaString = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      const url = 'https://example.com/shop?utm_source=ig';

      const result = parseVisitorData(ip, uaString, url);

      expect(result.device_type).toBe('mobile'); // iPhone is mobile
      expect(result.browser).toBe('Mobile Safari');
      expect(result.os).toBe('iOS');
      // GeoIP can sometimes vary depending on DB version, so we check if it is defined
      expect(result.country).toBeDefined();
      expect(result.utm.source).toBe('ig');
    });

    it('should handle unknown IPs and weird User-Agents gracefully (skenario gagal / fallback)', () => {
      const ip = '127.0.0.1'; // Localhost has no geo location usually
      const uaString = 'some weird user agent string that is not parseable';
      const url = '/just-path';

      const result = parseVisitorData(ip, uaString, url);

      expect(result.device_type).toBe('desktop'); // default fallback is desktop if undefined
      expect(result.browser).toBe('Unknown');
      expect(result.os).toBe('Unknown');
      expect(result.country).toBe('Unknown'); // Localhost returns no geo
    });
  });
});
