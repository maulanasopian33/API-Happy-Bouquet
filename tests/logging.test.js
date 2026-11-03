const os = require('os');
const path = require('path');
const fs = require('fs');

// Harus diset sebelum logger dimuat (logger membaca LOG_DIR saat require).
process.env.LOG_DIR = path.join(os.tmpdir(), `hb-logs-test-${process.pid}`);

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const db = require('../src/models');
const logger = require('../src/utils/logger');
const { sanitize } = require('../src/utils/logSanitize');

const logFile = (name) => path.join(process.env.LOG_DIR, name);

const waitFor = async (check, timeoutMs = 3000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
};

describe('Logging — audit & observability', () => {
  let adminToken;
  // Nama file rotasi memakai tanggal lokal server (bukan UTC).
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  beforeAll(async () => {
    fs.mkdirSync(process.env.LOG_DIR, { recursive: true });
    await db.sequelize.sync({ force: true });
    await db.User.create({
      name: 'Admin Log',
      email: 'admin@log.test',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@log.test', password: 'password123' });
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('sanitize menyamarkan field sensitif bersarang', () => {
    const result = sanitize({
      email: 'a@b.test',
      password: 'rahasia',
      nested: { token: 'abc123', note: 'aman' },
      Authorization: 'Bearer xyz',
    });

    expect(result.email).toBe('a@b.test');
    expect(result.password).toBe('[REDACTED]');
    expect(result.nested.token).toBe('[REDACTED]');
    expect(result.nested.note).toBe('aman');
    expect(result.Authorization).toBe('[REDACTED]');
  });

  it('membuat X-Request-Id dan memakai ulang header dari client', async () => {
    const generated = await request(app).get('/');
    expect(generated.headers['x-request-id']).toMatch(/[a-z0-9-]{8,}/i);

    const custom = await request(app).get('/').set('X-Request-Id', 'req-uji-123');
    expect(custom.headers['x-request-id']).toBe('req-uji-123');
  });

  it('respons error memuat requestId yang sama dengan header', async () => {
    const res = await request(app).get('/api/route-tidak-ada').set('X-Request-Id', 'req-404-abc');
    expect(res.status).toBe(404);
    expect(res.body.error.requestId).toBe('req-404-abc');
    expect(res.headers['x-request-id']).toBe('req-404-abc');
  });

  it('menulis access log http_request ke file log', async () => {
    await request(app).get('/').set('X-Request-Id', 'req-access-777');

    const file = logFile(`${today}.log`);
    const found = await waitFor(() => fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('req-access-777'));

    expect(found).toBe(true);
    const line = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .find((entry) => entry.includes('req-access-777'));
    const parsed = JSON.parse(line);
    expect(parsed.message).toBe('http_request');
    expect(parsed.method).toBe('GET');
    expect(parsed.status).toBe(200);
    expect(typeof parsed.durationMs).toBe('number');
    expect(parsed.service).toBe('api-happybouquet');
  });

  it('mencatat error beserta stack ke file error terpisah', async () => {
    logger.error('uji error terstruktur', new Error('boom'));

    const errorFile = logFile(`error-${today}.log`);
    const found = await waitFor(
      () => fs.existsSync(errorFile) && fs.readFileSync(errorFile, 'utf8').includes('uji error terstruktur')
    );

    expect(found).toBe(true);
    const parsed = JSON.parse(
      fs
        .readFileSync(errorFile, 'utf8')
        .split('\n')
        .find((entry) => entry.includes('uji error terstruktur'))
    );
    expect(parsed.level).toBe('error');
    expect(parsed.stack).toContain('boom');
  });

  it('GET /api/logs/:date mendukung filter level dan limit', async () => {
    const seedDate = '2026-01-01';
    fs.writeFileSync(
      logFile(`${seedDate}.log`),
      [
        JSON.stringify({ level: 'info', message: 'satu', requestId: 'seed-1' }),
        JSON.stringify({ level: 'error', message: 'dua', requestId: 'seed-2' }),
        JSON.stringify({ level: 'error', message: 'tiga', requestId: 'seed-3' }),
      ].join('\n') + '\n'
    );

    const errorsOnly = await request(app)
      .get(`/api/logs/${seedDate}?level=error`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(errorsOnly.status).toBe(200);
    expect(errorsOnly.body.data).toHaveLength(2);
    expect(errorsOnly.body.data.every((entry) => entry.level === 'error')).toBe(true);

    const limited = await request(app)
      .get(`/api/logs/${seedDate}?limit=1`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(limited.body.data).toHaveLength(1);
    expect(limited.body.data[0].requestId).toBe('seed-3');
  });

  it('menolak nama file log yang tidak valid (path traversal)', async () => {
    const res = await request(app)
      .get('/api/logs/..%2F..%2Fetc%2Fpasswd')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([400, 404]).toContain(res.status);
  });
});
