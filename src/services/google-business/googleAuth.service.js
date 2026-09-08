const db = require('../../models');
const { encrypt, decrypt } = require('../../utils/encryption');
const logger = require('../../utils/logger');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google-business/callback';
const GOOGLE_SCOPES = process.env.GOOGLE_SCOPES || 'https://www.googleapis.com/auth/business.manage';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

class GoogleAuthService {
  /**
   * Generate OAuth consent URL untuk Google Business Profile
   */
  static getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: GOOGLE_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: state || '',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Tukar authorization code dengan access + refresh token
   */
  static async exchangeCode(code) {
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('[GoogleAuth] Token exchange failed', { status: response.status, error: data });
      throw new Error(data.error_description || data.error || 'Gagal menukar authorization code');
    }

    return data;
  }

  /**
   * Refresh access token menggunakan refresh token
   */
  static async refreshAccessToken(setting) {
    const now = new Date();
    const refreshBufferMs = 5 * 60 * 1000; // refresh 5 menit sebelum expired

    if (setting.expires_at && (now.getTime() + refreshBufferMs) < new Date(setting.expires_at).getTime()) {
      return decrypt(setting.access_token);
    }

    const refreshToken = decrypt(setting.refresh_token);
    logger.info('[GoogleAuth] Refreshing access token...');

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('[GoogleAuth] Token refresh failed', { status: response.status, error: data });
      throw new Error(data.error_description || data.error || 'Gagal refresh token. Silakan hubungkan ulang akun Google.');
    }

    const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

    setting.access_token = encrypt(data.access_token);
    setting.expires_at = newExpiresAt;

    if (data.refresh_token) {
      setting.refresh_token = encrypt(data.refresh_token);
    }

    await setting.save();

    return data.access_token;
  }

  /**
   * Ambil access token yang valid (auto-refresh jika perlu)
   */
  static async getValidAccessToken() {
    const setting = await db.GoogleBusinessSetting.findByPk(1);
    if (!setting) {
      return null;
    }
    return await this.refreshAccessToken(setting);
  }

  /**
   * Ambil info akun Google (email, account id) dari token
   */
  static async getGoogleUserInfo(accessToken) {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  /**
   * Ambil daftar Google Business accounts
   */
  static async getBusinessAccounts(accessToken) {
    const response = await fetch(ACCOUNTS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  /**
   * Simpan token OAuth ke database (upsert singleton id=1)
   */
  static async saveAuthToken(tokenData, adminId) {
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = encrypt(refreshToken);

    let setting = await db.GoogleBusinessSetting.findByPk(1);
    if (setting) {
      setting.access_token = encryptedAccessToken;
      setting.refresh_token = encryptedRefreshToken;
      setting.expires_at = expiresAt;
      setting.scope = tokenData.scope || GOOGLE_SCOPES;
      setting.updated_by = adminId;
      await setting.save();
    } else {
      setting = await db.GoogleBusinessSetting.create({
        id: 1,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt,
        scope: tokenData.scope || GOOGLE_SCOPES,
        updated_by: adminId,
      });
    }

    // Ambil info akun Google lalu update
    try {
      const userInfo = await this.getGoogleUserInfo(accessToken);
      if (userInfo) {
        setting.google_account_email = userInfo.email;
      }

      const businessAccounts = await this.getBusinessAccounts(accessToken);
      if (businessAccounts && businessAccounts.accounts && businessAccounts.accounts.length > 0) {
        setting.google_account_id = businessAccounts.accounts[0].name;
      }

      await setting.save();
    } catch (err) {
      logger.warn('[GoogleAuth] Gagal ambil info akun Google', { error: err.message });
    }

    return setting;
  }

  /**
   * Hapus token (disconnect)
   */
  static async disconnect() {
    const setting = await db.GoogleBusinessSetting.findByPk(1);
    if (setting) {
      await setting.destroy();
    }
  }

  /**
   * Status koneksi
   */
  static async getConnectionStatus() {
    const setting = await db.GoogleBusinessSetting.findByPk(1);
    if (!setting) {
      return { connected: false };
    }

    return {
      connected: true,
      google_account_email: setting.google_account_email,
      google_account_id: setting.google_account_id,
      scope: setting.scope,
      updated_at: setting.updated_at,
    };
  }
}

module.exports = { GoogleAuthService };
