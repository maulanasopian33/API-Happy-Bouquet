import db from '../models';
import { encrypt, decrypt } from '../utils/encryption';
import crypto from 'crypto';

export class TiktokService {
  /**
   * Mengambil token global dan otomatis refresh jika sudah expired.
   */
  static async getActiveToken(): Promise<string | null> {
    const setting = await db.TiktokGlobalSetting.findByPk(1);
    if (!setting) {
      return null;
    }

    const now = new Date();
    // Jika token sudah kedaluwarsa, lakukan refresh
    if (now >= setting.expires_at) {
      return await this.refreshToken(setting);
    }

    return decrypt(setting.access_token);
  }

  /**
   * Mock API Refresh Token
   */
  static async refreshToken(setting: any): Promise<string> {
    console.log('[Mock TikTok API] Refreshing token...');
    
    // Validasi refresh token belum expired (biasanya 1 tahun)
    const now = new Date();
    if (now >= setting.refresh_expires_at) {
      throw new Error('Refresh token is expired. Admin needs to re-authenticate.');
    }

    // Mock API response
    const newAccessToken = 'mock_new_access_token_' + crypto.randomBytes(4).toString('hex');
    const newRefreshToken = 'mock_new_refresh_token_' + crypto.randomBytes(4).toString('hex');
    
    // Set 2 hours expiry for access token
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 2);

    setting.access_token = encrypt(newAccessToken);
    setting.refresh_token = encrypt(newRefreshToken);
    setting.expires_at = newExpiresAt;
    
    await setting.save();
    
    return newAccessToken;
  }

  /**
   * Mock API untuk publish video ke TikTok (Stream)
   */
  static async publishVideo(accessToken: string, caption: string, filePath: string): Promise<any> {
    console.log(`[Mock TikTok API] Uploading video with caption: ${caption}`);
    console.log(`[Mock TikTok API] File path: ${filePath}`);
    
    // Simulasikan delay upload stream
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response success
    return {
      success: true,
      data: {
        post_id: 'mock_post_id_' + crypto.randomBytes(8).toString('hex'),
        status: 'published'
      }
    };
  }

  /**
   * Menyimpan auth token baru dari admin (setelah OAuth success)
   */
  static async saveAuthToken(
    openId: string, 
    username: string, 
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number, 
    refreshExpiresIn: number, 
    adminId: number
  ) {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setSeconds(refreshExpiresAt.getSeconds() + refreshExpiresIn);

    const encryptedAccessToken = encrypt(accessToken);
    const encryptedRefreshToken = encrypt(refreshToken);

    let setting = await db.TiktokGlobalSetting.findByPk(1);
    if (setting) {
      setting.tiktok_open_id = openId;
      setting.tiktok_username = username;
      setting.access_token = encryptedAccessToken;
      setting.refresh_token = encryptedRefreshToken;
      setting.expires_at = expiresAt;
      setting.refresh_expires_at = refreshExpiresAt;
      setting.updated_by = adminId;
      await setting.save();
    } else {
      await db.TiktokGlobalSetting.create({
        id: 1, // Pastikan selalu 1
        tiktok_open_id: openId,
        tiktok_username: username,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt,
        refresh_expires_at: refreshExpiresAt,
        updated_by: adminId
      });
    }
  }

  static async getConnectionStatus() {
    const setting = await db.TiktokGlobalSetting.findByPk(1);
    if (!setting) {
      return { connected: false };
    }

    return {
      connected: true,
      username: setting.tiktok_username,
      updated_at: setting.updated_at
    };
  }
}
