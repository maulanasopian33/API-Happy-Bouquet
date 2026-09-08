const { GoogleAuthService } = require('./googleAuth.service');
const logger = require('../../utils/logger');

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const REQUEST_TIMEOUT_MS = 20000;

class GoogleBusinessClient {
  /**
   * Panggil Google Business API dengan auto-auth + retry + backoff
   */
  static async request(url, options = {}) {
    const {
      method = 'GET',
      body = null,
      retries = MAX_RETRIES,
      skipAuth = false,
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        let accessToken = null;
        if (!skipAuth) {
          accessToken = await GoogleAuthService.getValidAccessToken();
          if (!accessToken) {
            throw new Error('Tidak ada token Google Business yang tersimpan. Silakan hubungkan akun terlebih dahulu.');
          }
        }

        const headers = {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(options.headers || {}),
        };

        const fetchOptions = {
          method,
          headers,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        };

        if (body && method !== 'GET') {
          fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);

        // Handle rate limit (429) dengan retry + exponential backoff
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
          const backoffMs = retryAfter > 0
            ? retryAfter * 1000
            : INITIAL_BACKOFF_MS * Math.pow(2, attempt);

          logger.warn(`[GBP Client] Rate limited (429) on ${url}, retry in ${backoffMs}ms (attempt ${attempt + 1}/${retries})`);

          if (attempt < retries) {
            await this.sleep(backoffMs);
            continue;
          }
        }

        // Handle transient errors (500, 502, 503, 504)
        if ([500, 502, 503, 504].includes(response.status) && attempt < retries) {
          const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          logger.warn(`[GBP Client] Server error ${response.status} on ${url}, retry in ${backoffMs}ms`);
          await this.sleep(backoffMs);
          continue;
        }

        // Handle empty response (204 No Content)
        if (response.status === 204) {
          return { success: true };
        }

        // Parse response
        const text = await response.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { raw: text };
        }

        if (!response.ok) {
          const errorMsg = data?.error?.message || `HTTP ${response.status}`;
          const errorCode = data?.error?.code || response.status;

          logger.error(`[GBP Client] API error ${response.status} on ${url}`, {
            status: response.status,
            errorCode,
            errorMsg,
          });

          return {
            error: {
              status: response.status,
              code: errorCode,
              message: errorMsg,
              details: data?.error?.details || null,
            },
          };
        }

        return data;

      } catch (error) {
        lastError = error;

        // AbortError = timeout
        if (error.name === 'AbortError') {
          logger.warn(`[GBP Client] Request timeout on ${url} (attempt ${attempt + 1}/${retries})`);
          if (attempt < retries) {
            await this.sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
            continue;
          }
        }

        // Network errors — retry
        if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          logger.warn(`[GBP Client] Network error on ${url}: ${error.code} (attempt ${attempt + 1}/${retries})`);
          if (attempt < retries) {
            await this.sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
            continue;
          }
        }

        // Auth errors — jangan retry
        if (error.message.includes('hubungkan ulang')) {
          throw error;
        }
      }
    }

    throw lastError || new Error(`Request gagal setelah ${retries + 1} percobaan`);
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  static get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  static post(url, body, options = {}) {
    return this.request(url, { ...options, method: 'POST', body });
  }

  static put(url, body, options = {}) {
    return this.request(url, { ...options, method: 'PUT', body });
  }

  static patch(url, body, options = {}) {
    return this.request(url, { ...options, method: 'PATCH', body });
  }

  static delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

module.exports = { GoogleBusinessClient };
