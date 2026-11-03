const { detectBot } = require('../src/utils/botDetector');

describe('botDetector', () => {
  it('mendeteksi Googlebot sebagai good bot search engine', () => {
    const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const res = detectBot(ua);
    expect(res.is_bot).toBe(true);
    expect(res.bot_name).toBe('Googlebot');
    expect(res.bot_category).toBe('search_engine');
    expect(res.threat_level).toBe('info');
  });

  it('mendeteksi WhatsApp link preview bot', () => {
    const ua = 'WhatsApp/2.21.12.21 A';
    const res = detectBot(ua);
    expect(res.is_bot).toBe(true);
    expect(res.bot_category).toBe('social_preview');
  });

  it('mendeteksi python-requests scraper', () => {
    const ua = 'python-requests/2.28.1';
    const res = detectBot(ua);
    expect(res.is_bot).toBe(true);
    expect(res.bot_category).toBe('scraper_cli');
    expect(res.threat_level).toBe('medium');
  });

  it('mendeteksi security scanner nikto / sqlmap', () => {
    const ua = 'Nikto/2.1.6';
    const res = detectBot(ua);
    expect(res.is_bot).toBe(true);
    expect(res.threat_level).toBe('high');
  });

  it('mendeteksi automation webdriver dari payload client', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const res = detectBot(ua, { is_webdriver: true });
    expect(res.is_bot).toBe(true);
    expect(res.bot_category).toBe('automation');
  });

  it('mendeteksi browser manusia nyata (Chrome, Safari, Firefox mobile/desktop)', () => {
    const humanUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const res = detectBot(humanUa, { is_webdriver: false });
    expect(res.is_bot).toBe(false);
    expect(res.bot_name).toBeNull();
  });
});

