const request = require('supertest');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const db = require('../src/models');

// Sync seluruh skema butuh waktu di MySQL lokal; suite ini membuat/menghapus banyak tabel.
jest.setTimeout(180000);

const API_ROOT = path.resolve(__dirname, '..');
const MEDIA_DIR = path.join(API_ROOT, 'public', 'uploads', 'media');
const OUTPUT_DIR = path.join(API_ROOT, 'public', 'uploads', 'media-creator');

describe('Media Creator API', () => {
  let token;
  let sourceMedia;
  let logoMedia;
  let templateId;
  let plainTemplateId;
  let projectId;
  let firstOutput;

  const cleanupFiles = [];

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    await db.User.create({
      name: 'Admin Media',
      email: 'media@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'media@test.com', password: 'password123' });
    token = login.body.data.token;

    await fs.promises.mkdir(MEDIA_DIR, { recursive: true });

    const sourcePath = path.join(MEDIA_DIR, 'media-creator-source.png');
    const logoPath = path.join(MEDIA_DIR, 'media-creator-logo.png');
    await new Jimp(800, 600, 0xff0000ff).writeAsync(sourcePath);
    await new Jimp(100, 50, 0x00ff00ff).writeAsync(logoPath);
    cleanupFiles.push(sourcePath, logoPath);

    sourceMedia = await db.Media.create({
      filename: 'media-creator-source.png',
      originalName: 'source.png',
      mimeType: 'image/png',
      size: fs.statSync(sourcePath).size,
      path: 'public/uploads/media/media-creator-source.png',
    });
    logoMedia = await db.Media.create({
      filename: 'media-creator-logo.png',
      originalName: 'logo.png',
      mimeType: 'image/png',
      size: fs.statSync(logoPath).size,
      path: 'public/uploads/media/media-creator-logo.png',
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
    for (const file of cleanupFiles) {
      try {
        await fs.promises.unlink(file);
      } catch (_) {
        // sudah tidak ada
      }
    }
    await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true });
  });

  // Tambahkan header auth ke request supertest yang sudah dibuat.
  const auth = (req) => req.set('Authorization', `Bearer ${token}`);
  const post = (url, body) => auth(request(app).post(url)).send(body);

  it('menolak template dengan ukuran di luar batas', async () => {
    const res = await post('/api/media-creator/templates', {
      name: 'Terlalu kecil',
      width: 100,
      height: 100,
    });

    expect(res.status).toBe(422);
  });

  it('membuat template watermark', async () => {
    const res = await post('/api/media-creator/templates', {
      name: 'Feed 1:1',
      width: 240,
      height: 240,
      watermark_media_id: logoMedia.id,
      watermark_position: 'bottom-right',
      watermark_scale: 20,
      watermark_opacity: 80,
      margin: 32,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeTruthy();
    templateId = res.body.data.id;
  });

  it('membuat template tanpa watermark', async () => {
    const res = await post('/api/media-creator/templates', {
      name: 'Story 9:16',
      width: 240,
      height: 360,
      watermark_position: 'custom',
      watermark_x: 50,
      watermark_y: 90,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.watermark_media_id).toBeNull();
    plainTemplateId = res.body.data.id;
  });

  it('menolak project dengan lebih dari 8 template', async () => {
    const res = await post('/api/media-creator/projects', {
      name: 'Kebanyakan',
      source_media_id: sourceMedia.id,
      template_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    });

    expect(res.status).toBe(422);
  });

  it('membuat project media', async () => {
    const res = await post('/api/media-creator/projects', {
      name: 'Promo Mawar',
      source_media_id: sourceMedia.id,
      template_ids: [templateId, plainTemplateId],
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.template_ids).toHaveLength(2);
    projectId = res.body.data.id;
  });

  it('menghasilkan PNG sesuai template + watermark', async () => {
    const res = await post(`/api/media-creator/projects/${projectId}/generate`, {
      template_id: templateId,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.width).toBe(240);
    expect(res.body.data.height).toBe(240);
    expect(res.body.data.warning).toBeNull();

    const filePath = path.join(API_ROOT, res.body.data.media.path);
    expect(fs.existsSync(filePath)).toBe(true);

    const image = await Jimp.read(filePath);
    expect(image.bitmap.width).toBe(240);
    expect(image.bitmap.height).toBe(240);

    firstOutput = res.body.data;
  });

  it('generate ulang mengganti output, bukan menambah baris', async () => {
    const res = await post(`/api/media-creator/projects/${projectId}/generate`, {
      template_id: templateId,
    });

    expect(res.status).toBe(200);

    const count = await db.MediaCreatorOutput.count({
      where: { project_id: projectId, template_id: templateId },
    });
    expect(count).toBe(1);

    const oldMedia = await db.Media.findByPk(firstOutput.media.id);
    expect(oldMedia).toBeNull();
  });

  it('menghasilkan output tanpa watermark', async () => {
    const res = await post(`/api/media-creator/projects/${projectId}/generate`, {
      template_id: plainTemplateId,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.width).toBe(240);
    expect(res.body.data.height).toBe(360);

    const project = await auth(request(app).get(`/api/media-creator/projects/${projectId}`));
    expect(project.body.data.status).toBe('done');
  });

  it('menolak template di luar project', async () => {
    const other = await post('/api/media-creator/templates', {
      name: 'Lain',
      width: 240,
      height: 240,
    });

    const res = await post(`/api/media-creator/projects/${projectId}/generate`, {
      template_id: other.body.data.id,
    });

    expect(res.status).toBe(422);
  });

  it('menghapus project membersihkan file dan Media hasil', async () => {
    const output = await db.MediaCreatorOutput.findOne({ where: { project_id: projectId } });
    const media = await db.Media.findByPk(output.media_id);
    const filePath = path.join(API_ROOT, media.path);

    const res = await auth(request(app).delete(`/api/media-creator/projects/${projectId}`));
    expect(res.status).toBe(200);

    expect(await db.MediaCreatorProject.findByPk(projectId)).toBeNull();
    expect(await db.MediaCreatorOutput.count({ where: { project_id: projectId } })).toBe(0);
    expect(await db.Media.findByPk(media.id)).toBeNull();
    expect(fs.existsSync(filePath)).toBe(false);

    // Foto sumber & logo tidak ikut terhapus.
    expect(await db.Media.findByPk(sourceMedia.id)).not.toBeNull();
    expect(await db.Media.findByPk(logoMedia.id)).not.toBeNull();
  });
});
