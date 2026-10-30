const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');
const bcrypt = require('bcryptjs');
const { isOriginAllowed } = require('../src/utils/cors');

describe('Production Readiness & Security Hardening (P2 & P3)', () => {
  let adminToken;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    await db.User.create({
      name: 'Admin Sec2',
      email: 'sec2@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'sec2@test.com',
      password: 'password123',
    });
    adminToken = res.body.data.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('SEC-005: CORS Origin Restriction', () => {
    it('isOriginAllowed should deny unauthorized origins in production mode', () => {
      const origEnv = process.env.NODE_ENV;
      const origCors = process.env.CORS_ORIGINS;
      try {
        process.env.NODE_ENV = 'production';
        process.env.CORS_ORIGINS = 'https://happybouquet.web.id,https://panel.happybouquet.web.id';

        expect(isOriginAllowed('https://happybouquet.web.id')).toBe(true);
        expect(isOriginAllowed('https://panel.happybouquet.web.id')).toBe(true);
        expect(isOriginAllowed('https://evil-attacker.com')).toBe(false);
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.CORS_ORIGINS = origCors;
      }
    });
  });

  describe('SEC-009: Path Traversal on Log Reader', () => {
    it('should reject invalid date format with 400 (path traversal attempt)', async () => {
      const res = await request(app)
        .get('/api/logs/..%2f..%2fpackage.json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Format tanggal tidak valid');
    });

    it('should reject non-YYYY-MM-DD input with 400', async () => {
      const res = await request(app)
        .get('/api/logs/today')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Format tanggal tidak valid');
    });
  });

  describe('SEC-008: Log Flooding & Payload Limitation', () => {
    it('should reject frontend log when message is missing or empty', async () => {
      const res = await request(app).post('/api/logs').send({ level: 'info' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Message wajib diisi');
    });

    it('should reject frontend log exceeding 1000 characters', async () => {
      const longMessage = 'A'.repeat(1001);
      const res = await request(app).post('/api/logs').send({
        level: 'info',
        message: longMessage,
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('1000 karakter');
    });

    it('should accept valid frontend log within limits', async () => {
      const res = await request(app).post('/api/logs').send({
        level: 'info',
        message: 'Valid frontend log message',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe(true);
    });
  });

  describe('SEC-006: Google Business OAuth CSRF Protection', () => {
    it('should reject callback with 403 when state is missing or mismatched', async () => {
      const res = await request(app)
        .get('/api/google-business/callback?code=mock_code&state=forged_state')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('OAuth state tidak valid');
    });
  });

  describe('SEC-007: Live Role Verification & Revocation on Demoted Admin', () => {
    it('should immediately reject access to admin endpoint if admin is demoted in DB despite valid JWT', async () => {
      // Buat admin sementara
      const tempAdmin = await db.User.create({
        name: 'Temp Admin',
        email: 'tempadmin@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'admin',
      });

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'tempadmin@test.com',
        password: 'password123',
      });
      const tempToken = loginRes.body.data.token;

      // Akses awal berhasil (200)
      const resBefore = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${tempToken}`);
      expect(resBefore.statusCode).toBe(200);

      // Ubah role user di database menjadi 'customer' (demote)
      await tempAdmin.update({ role: 'customer' });

      // Request berikutnya dengan token JWT yang sama HARUS ditolak 403
      const resAfter = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${tempToken}`);
      expect(resAfter.statusCode).toBe(403);
      expect(resAfter.body.message).toContain('Akses ditolak. Memerlukan role');
    });
  });

  describe('SEC-012: Production Health Payload', () => {
    it('should not leak server hostname and hardware details in production', async () => {
      const origEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('ok');
        expect(res.body.data.hostname).toBeUndefined();
        expect(res.body.data.cpus).toBeUndefined();
        expect(res.body.data.memory).toBeUndefined();
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });
  });
});

