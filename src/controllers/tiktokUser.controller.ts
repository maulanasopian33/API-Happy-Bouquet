import { Request, Response } from 'express';
import { TiktokService } from '../services/tiktok.service';
import fs from 'fs';
import { successResponse, errorResponse } from '../utils/response';

export class TiktokUserController {

  /**
   * Endpoint untuk mempublish video ke TikTok
   */
  static async publishVideo(req: Request, res: Response): Promise<void> {
    const file = req.file;
    const { caption } = req.body;

    if (!file) {
      errorResponse(res, 'File video wajib diunggah', null, 400);
      return;
    }

    if (caption && caption.length > 2000) {
      errorResponse(res, 'Caption melebihi batas 2000 karakter', null, 400);
      // Clean up directly
      fs.unlinkSync(file.path);
      return;
    }

    try {
      const accessToken = await TiktokService.getActiveToken();
      if (!accessToken) {
        errorResponse(res, 'Akun TikTok belum dihubungkan oleh Admin', null, 400);
        return;
      }

      // Memanggil layanan untuk publish (Mock)
      const result = await TiktokService.publishVideo(accessToken, caption || '', file.path);

      successResponse(res, 'Video berhasil dipublikasikan', result.data);
    } catch (error: any) {
      errorResponse(res, error.message || 'Gagal mempublikasikan video', null, 500);
    } finally {
      // Selalu hapus file temporary untuk mitigasi space server
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
}
