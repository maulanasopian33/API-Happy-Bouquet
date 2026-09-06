const db = require('../models');
const { encrypt, decrypt } = require('../utils/encryption');
const crypto = require('crypto');
const logger = require('../utils/logger');

class TiktokService {
  static async getActiveToken() {
    const setting = await db.TiktokGlobalSetting.findByPk(1);
    if (!setting) {
      return null;
    }

    const now = new Date();
    if (now >= setting.expires_at) {
      return await this.refreshToken(setting);
    }

    return decrypt(setting.access_token);
  }

  static async refreshToken(setting) {
    logger.info('[Mock TikTok API] Refreshing token...');
    
    const now = new Date();
    if (now >= setting.refresh_expires_at) {
      throw new Error('Refresh token is expired. Admin needs to re-authenticate.');
    }

    const newAccessToken = 'mock_new_access_token_' + crypto.randomBytes(4).toString('hex');
    const newRefreshToken = 'mock_new_refresh_token_' + crypto.randomBytes(4).toString('hex');
    
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 2);

    setting.access_token = encrypt(newAccessToken);
    setting.refresh_token = encrypt(newRefreshToken);
    setting.expires_at = newExpiresAt;
    
    await setting.save();
    
    return newAccessToken;
  }

  static async publishVideo(accessToken, caption, filePath) {
    logger.info(`[Mock TikTok API] Uploading video with caption: ${caption}`);
    logger.info(`[Mock TikTok API] File path: ${filePath}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      data: {
        post_id: 'mock_post_id_' + crypto.randomBytes(8).toString('hex'),
        status: 'published'
      }
    };
  }

  static async saveAuthToken(
    openId,
    username,
    accessToken,
    refreshToken,
    expiresIn,
    refreshExpiresIn,
    adminId
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
        id: 1,
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

module.exports = { TiktokService };
