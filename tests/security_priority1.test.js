const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const db = require('../src/models');
const { createUploader } = require('../src/middlewares/uploadMiddleware');
const express = require('express');

describe('Security Priority 1 Verifications', () => {
  const secret = process.env.JWT_SECRET || 'test_jwt_secret_for_tests';
  process.env.JWT_SECRET = secret;

  const validToken = jwt.sign(
    { id: 999, email: 'user999@hb.com', role: 'customer' },
    secret,
    { expiresIn: '1h' }
  );

  describe('1. Notifications via SSE (/api/notifications/stream)', () => {
    it('should reject unauthenticated SSE connection with 401', async () => {
      const res = await request(app).get('/api/notifications/stream');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe(false);
    });

    it('should establish SSE stream with text/event-stream for authenticated user', async () => {
      const res = await request(app)
        .get('/api/notifications/stream')
        .set('Authorization', `Bearer ${validToken}`)
        .buffer(true)
        .parse((res, callback) => {
          // Read first chunk and close connection
          res.on('data', (chunk) => {
            res.destroy();
            callback(null, chunk.toString());
          });
        });

      expect(res.headers['content-type']).toContain('text/event-stream');
      expect(res.headers['cache-control']).toContain('no-cache');
    });
  });

  describe('2. File Upload Strict Extensions (No SVG / Scripts)', () => {
    const uploadTestApp = express();
    const testUploader = createUploader('test_sec', 'sec');
    uploadTestApp.post('/test-upload', testUploader.single('file'), (req, res) => {
      res.json({ success: true, filename: req.file.filename });
    });
    uploadTestApp.use((err, req, res, _next) => {
      res.status(400).json({ success: false, error: err.message });
    });

    it('should reject .svg files even if labeled image/svg+xml', async () => {
      const res = await request(uploadTestApp)
        .post('/test-upload')
        .attach('file', Buffer.from('<svg><script>alert(1)</script></svg>'), {
          filename: 'xss.svg',
          contentType: 'image/svg+xml',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Hanya file gambar JPG, JPEG, PNG, dan WebP');
    });

    it('should reject .php or executable scripts with spoofed image mimetype', async () => {
      const res = await request(uploadTestApp)
        .post('/test-upload')
        .attach('file', Buffer.from('<?php echo "shell"; ?>'), {
          filename: 'shell.php',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Hanya file gambar JPG, JPEG, PNG, dan WebP');
    });

    it('should accept valid PNG images', async () => {
      // 1x1 transparent PNG buffer
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      );

      const res = await request(uploadTestApp)
        .post('/test-upload')
        .attach('file', pngBuffer, {
          filename: 'valid.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.filename).toMatch(/\.png$/);

      // Clean up uploaded test file
      const uploadedPath = path.join(process.cwd(), 'public/uploads/test_sec', res.body.filename);
      if (fs.existsSync(uploadedPath)) {
        fs.unlinkSync(uploadedPath);
      }
    });
  });

  describe('3. Private Invoice Storage Location', () => {
    it('storage/invoices directory must exist outside public/', () => {
      const storageInvoices = path.join(__dirname, '../storage/invoices');
      expect(fs.existsSync(storageInvoices)).toBe(true);

      const publicInvoices = path.join(__dirname, '../public/uploads/invoices');
      expect(fs.existsSync(publicInvoices)).toBe(false);
    });
  });
});
