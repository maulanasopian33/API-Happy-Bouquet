const path = require('path');
const fs = require('fs');
const os = require('os');
const Jimp = require('jimp');
const {
  computePosition,
  renderImage,
  resolveUploadPath,
  slugify,
  withTimeout,
} = require('../src/services/mediaCreatorRenderService');

// Unit murni: tidak menyentuh DB, jadi jauh lebih cepat dari mediaCreator.test.js.
describe('Media Creator — geometri & render', () => {
  describe('computePosition 9 preset', () => {
    const geometry = { canvasW: 1000, canvasH: 500, logoW: 200, logoH: 100, margin: 10 };

    test.each([
      ['top-left', 10, 10],
      ['top-center', 400, 10],
      ['top-right', 790, 10],
      ['middle-left', 10, 200],
      ['center', 400, 200],
      ['middle-right', 790, 200],
      ['bottom-left', 10, 390],
      ['bottom-center', 400, 390],
      ['bottom-right', 790, 390],
    ])('%s', (position, x, y) => {
      expect(computePosition({ ...geometry, position })).toEqual({ x, y });
    });

    test('posisi tak dikenal jatuh ke bottom-right', () => {
      expect(computePosition({ ...geometry, position: 'kiri-atas' })).toEqual({ x: 790, y: 390 });
    });
  });

  describe('computePosition custom', () => {
    const geometry = { canvasW: 1000, canvasH: 500, logoW: 200, logoH: 100, position: 'custom' };

    test('persen ruang sisa', () => {
      expect(computePosition({ ...geometry, x: 50, y: 90 })).toEqual({ x: 400, y: 360 });
    });

    test('x/y di luar 0–100 dijepit ke tepi kanvas', () => {
      expect(computePosition({ ...geometry, x: -20, y: 150 })).toEqual({ x: 0, y: 400 });
    });

    test('logo lebih besar dari kanvas tidak menghasilkan koordinat negatif', () => {
      expect(
        computePosition({
          canvasW: 100,
          canvasH: 80,
          logoW: 200,
          logoH: 150,
          position: 'bottom-right',
        })
      ).toEqual({ x: 0, y: 0 });
    });
  });

  describe('resolveUploadPath', () => {
    test('menerima path di dalam public/uploads', () => {
      const rel = 'public/uploads/media/foto.png';
      expect(resolveUploadPath(rel)).toBe(path.resolve(__dirname, '..', rel));
    });

    test.each(['public/uploads_lain/foto.png', 'public/foto.png', '../rahasia.png'])(
      'menolak %s',
      (rel) => {
        expect(() => resolveUploadPath(rel)).toThrow('Path media tidak valid');
      }
    );
  });

  describe('withTimeout', () => {
    test('meneruskan hasil promise yang selesai tepat waktu', async () => {
      await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
    });

    test('melempar 504 saat render melebihi batas', async () => {
      const pending = new Promise(() => {});
      await expect(withTimeout(pending, 10)).rejects.toMatchObject({
        statusCode: 504,
        message: 'Render melebihi batas waktu',
      });
    });
  });

  describe('renderImage', () => {
    let dir;
    let sourcePath;
    let logoPath;

    beforeAll(async () => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-render-'));
      sourcePath = path.join(dir, 'source.png');
      logoPath = path.join(dir, 'logo.png');
      await new Jimp(60, 40, 0xff0000ff).writeAsync(sourcePath);
      await new Jimp(20, 10, 0x00ff00ff).writeAsync(logoPath);
    });

    afterAll(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    const template = {
      width: 48,
      height: 32,
      watermark_scale: 20,
      watermark_opacity: 50,
      watermark_position: 'center',
      margin: 0,
    };

    test('menghasilkan PNG sesuai rasio template', async () => {
      const { buffer, warning } = await renderImage({ sourcePath, watermarkPath: logoPath, template });
      const out = await Jimp.read(buffer);
      expect(warning).toBeNull();
      expect(out.bitmap.width).toBe(48);
      expect(out.bitmap.height).toBe(32);
    });

    test('logo hilang tetap menghasilkan output + warning', async () => {
      const { buffer, warning } = await renderImage({
        sourcePath,
        watermarkPath: path.join(dir, 'tidak-ada.png'),
        template,
      });
      const out = await Jimp.read(buffer);
      expect(warning).toMatch(/tanpa logo/);
      expect(out.bitmap.width).toBe(48);
    });
  });

  test('slugify aman untuk nama file', () => {
    expect(slugify('Promo Spesial 8.8!')).toBe('promo-spesial-8-8');
    expect(slugify('   ')).toBe('output');
  });
});
