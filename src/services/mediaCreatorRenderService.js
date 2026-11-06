const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

const API_ROOT = path.resolve(__dirname, '..', '..');
const UPLOAD_ROOT = path.join(API_ROOT, 'public', 'uploads');
const OUTPUT_ROOT = path.join(UPLOAD_ROOT, 'media-creator');
const RENDER_TIMEOUT_MS = 30000;

const POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
  'custom',
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Path file selalu berasal dari kolom Media.path; tolak apa pun di luar public/uploads.
const resolveUploadPath = (relPath) => {
  const abs = path.resolve(API_ROOT, String(relPath || ''));
  if (!abs.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new Error('Path media tidak valid');
  }
  return abs;
};

const slugify = (text) =>
  String(text || 'output')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'output';

// x/y = persentase ruang sisa, jadi logo tidak pernah keluar kanvas.
const computePosition = ({
  position = 'bottom-right',
  margin = 0,
  canvasW,
  canvasH,
  logoW,
  logoH,
  x = 50,
  y = 50,
}) => {
  const maxX = Math.max(0, canvasW - logoW);
  const maxY = Math.max(0, canvasH - logoH);

  if (position === 'custom') {
    return {
      x: clamp(Math.round((Number(x) / 100) * maxX), 0, maxX),
      y: clamp(Math.round((Number(y) / 100) * maxY), 0, maxY),
    };
  }

  const m = Math.max(0, Number(margin) || 0);
  const midX = Math.round(maxX / 2);
  const midY = Math.round(maxY / 2);
  const map = {
    'top-left': [m, m],
    'top-center': [midX, m],
    'top-right': [maxX - m, m],
    'middle-left': [m, midY],
    center: [midX, midY],
    'middle-right': [maxX - m, midY],
    'bottom-left': [m, maxY - m],
    'bottom-center': [midX, maxY - m],
    'bottom-right': [maxX - m, maxY - m],
  };
  const [px, py] = map[position] || map['bottom-right'];
  return { x: clamp(Math.round(px), 0, maxX), y: clamp(Math.round(py), 0, maxY) };
};

const renderImage = async ({ sourcePath, watermarkPath, template }) => {
  const width = Number(template.width);
  const height = Number(template.height);
  let warning = null;

  const image = await Jimp.read(sourcePath);
  image.cover(width, height);

  if (watermarkPath) {
    if (!fs.existsSync(watermarkPath)) {
      warning = 'Logo watermark tidak ditemukan, output dibuat tanpa logo';
    } else {
      try {
        const logo = await Jimp.read(watermarkPath);
        const logoWidth = Math.max(
          1,
          Math.round((width * (Number(template.watermark_scale) || 18)) / 100)
        );
        logo.resize(logoWidth, Jimp.AUTO);
        const opacity = clamp(Number(template.watermark_opacity ?? 80), 0, 100);
        logo.opacity(opacity / 100);

        const { x, y } = computePosition({
          position: template.watermark_position,
          margin: template.margin,
          canvasW: width,
          canvasH: height,
          logoW: logo.bitmap.width,
          logoH: logo.bitmap.height,
          x: template.watermark_x,
          y: template.watermark_y,
        });

        image.composite(logo, x, y);
      } catch (e) {
        warning = 'Logo watermark gagal dibaca, output dibuat tanpa logo';
      }
    }
  }

  const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
  return { buffer, warning, width, height };
};

const withTimeout = async (promise, ms = RENDER_TIMEOUT_MS) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(Object.assign(new Error('Render melebihi batas waktu'), { statusCode: 504 }));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

const writeOutputFile = async ({ projectId, templateName, buffer }) => {
  const dir = path.join(OUTPUT_ROOT, String(projectId));
  await fs.promises.mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${slugify(templateName)}.png`;
  const absPath = path.join(dir, filename);
  await fs.promises.writeFile(absPath, buffer);
  const relPath = path.relative(API_ROOT, absPath).split(path.sep).join('/');
  return { absPath, relPath, filename };
};

const deleteFileQuietly = async (absPath) => {
  try {
    await fs.promises.unlink(absPath);
  } catch (_) {
    // file sudah tidak ada — abaikan
  }
};

module.exports = {
  POSITIONS,
  RENDER_TIMEOUT_MS,
  computePosition,
  renderImage,
  writeOutputFile,
  deleteFileQuietly,
  resolveUploadPath,
  slugify,
  withTimeout,
};
