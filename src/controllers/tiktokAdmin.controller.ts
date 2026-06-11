import { Request, Response } from 'express';
import { TiktokService } from '../services/tiktok.service';
import crypto from 'crypto';

export class TiktokAdminController {
  
  /**
   * Mock endpoint untuk mendapatkan status akun
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await TiktokService.getConnectionStatus();
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Mock endpoint untuk generate auth URL
   */
  static async getAuthUrl(req: Request, res: Response): Promise<void> {
    // Di real implementation, ini akan generate URL OAuth resmi TikTok
    const mockAuthUrl = `http://localhost:5173/admin/tiktok-settings?mock_callback=true`;
    res.json({ success: true, url: mockAuthUrl });
  }

  /**
   * Mock endpoint untuk handle callback dari TikTok
   */
  static async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      // Di real implementation, req.query.code digunakan untuk fetch token
      
      const adminId = (req as any).user?.id || 1; // Asumsi admin dari token
      
      const openId = 'mock_open_id_' + crypto.randomBytes(4).toString('hex');
      const username = '@mock_admin_tiktok';
      const accessToken = 'mock_access_token_' + crypto.randomBytes(8).toString('hex');
      const refreshToken = 'mock_refresh_token_' + crypto.randomBytes(8).toString('hex');
      
      const expiresIn = 2 * 60 * 60; // 2 hours
      const refreshExpiresIn = 365 * 24 * 60 * 60; // 1 year

      await TiktokService.saveAuthToken(
        openId,
        username,
        accessToken,
        refreshToken,
        expiresIn,
        refreshExpiresIn,
        adminId
      );

      res.json({ success: true, message: 'TikTok account connected successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
