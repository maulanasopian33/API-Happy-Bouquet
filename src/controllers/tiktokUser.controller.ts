import { Request, Response } from 'express';
import { TiktokService } from '../services/tiktok.service';
import fs from 'fs';

export class TiktokUserController {
  
  /**
   * Endpoint untuk mempublish video ke TikTok
   */
  static async publishVideo(req: Request, res: Response): Promise<void> {
    const file = req.file;
    const { caption } = req.body;

    if (!file) {
      res.status(400).json({ success: false, message: 'Video file is required' });
      return;
    }

    if (caption && caption.length > 2000) {
      res.status(400).json({ success: false, message: 'Caption exceeds 2000 characters limit' });
      // Clean up directly
      fs.unlinkSync(file.path);
      return;
    }

    try {
      const accessToken = await TiktokService.getActiveToken();
      if (!accessToken) {
        res.status(400).json({ success: false, message: 'TikTok account is not connected by Admin' });
        return;
      }

      // Memanggil layanan untuk publish (Mock)
      const result = await TiktokService.publishVideo(accessToken, caption || '', file.path);
      
      res.json({ success: true, message: 'Video published successfully', data: result.data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to publish video' });
    } finally {
      // Selalu hapus file temporary untuk mitigasi space server
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
}
