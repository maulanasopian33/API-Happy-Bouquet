import { Response, NextFunction } from 'express';
import { AuthRequest, AUTH_COOKIE_NAME } from './authMiddleware';
import { ErrorCodes } from '../constants/errors';

/**
 * Proteksi CSRF untuk autentikasi berbasis cookie.
 *
 * Strategi:
 * - Cookie auth `SameSite=Lax` — browser hanya mengirim cookie pada request same-site.
 * - Method mutasi (POST/PUT/PATCH/DELETE) yang datang dari cookie WAJIB menyertakan
 *   header `X-Requested-With: XMLHttpRequest` (atau nilai non-kosong apa pun).
 *   Header ini TIDAK bisa dikirim cross-origin tanpa persetujuan CORS preflight,
 *   sehingga request lintas-situs tidak lolos.
 * - Request yang murni memakai Bearer token (storefront Nuxt / API client)
 *   TIDAK dikenakan aturan ini — mereka tidak bergantung pada cookie.
 */
export const csrfGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;

  // Tidak pakai cookie → tidak relevan untuk CSRF (Bearer-only / publik).
  if (!cookieToken) {
    return next();
  }

  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!mutating) {
    return next();
  }

  const xRequestedWith = req.headers['x-requested-with'];
  if (!xRequestedWith || String(xRequestedWith).trim() === '') {
    return res.status(403).json({
      status: false,
      message: 'CSRF: header X-Requested-With wajib disertakan.',
      data: null,
      error: {
        code: ErrorCodes.FORBIDDEN,
        message: 'CSRF: header X-Requested-With wajib disertakan.',
      },
    });
  }

  next();
};
