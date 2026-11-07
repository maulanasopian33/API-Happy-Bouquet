jest.mock('../src/services/google-business/googleBusinessClient', () => ({
  GoogleBusinessClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock('../src/services/google-business/googleAuth.service', () => ({ GoogleAuthService: {} }));
jest.mock('../src/services/mediaService', () => ({ getMediaById: jest.fn() }));
jest.mock('../src/utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const { GoogleBusinessClient } = require('../src/services/google-business/googleBusinessClient');
const { GoogleBusinessService, resolveMediaPath } = require('../src/services/googleBusiness.service');

const LOCATION = 'accounts/1/locations/2';

const mediaItem = (id, overrides = {}) => ({
  name: `${LOCATION}/media/${id}`,
  mediaFormat: 'PHOTO',
  googleUrl: `https://lh3.googleusercontent.com/${id}=s100`,
  createTime: '2026-01-01T00:00:00Z',
  locationAssociation: { category: 'PRODUCT' },
  insights: { viewCount: '10' },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Google Business Media — list', () => {
  test('menggabungkan pageToken, menormalkan thumbnail, dan menghitung ringkasan', async () => {
    GoogleBusinessClient.get
      .mockResolvedValueOnce({ mediaItems: [mediaItem('lama', { createTime: '2026-01-01T00:00:00Z' })], nextPageToken: 't1' })
      .mockResolvedValueOnce({
        mediaItems: [mediaItem('baru', { createTime: '2026-02-01T00:00:00Z', attribution: { profileName: 'Budi' } })],
      });

    const result = await GoogleBusinessService.listMedia('accounts/1/locations/9', { pageSize: 24 });

    expect(GoogleBusinessClient.get).toHaveBeenCalledTimes(2);
    expect(GoogleBusinessClient.get.mock.calls[1][0]).toContain('pageToken=t1');
    expect(result.mediaItems).toHaveLength(2);
    expect(result.mediaItems[0].name).toContain('/baru'); // sort newest
    expect(result.mediaItems[0].thumbnailUrl).toContain('=s800');
    expect(result.summary).toMatchObject({ total: 2, owner: 1, customer: 1 });
    expect(result.summary.byCategory.PRODUCT).toBe(2);
  });

  test('filter kategori, sumber, pencarian, sort tayangan, dan paging', async () => {
    GoogleBusinessClient.get.mockResolvedValueOnce({
      mediaItems: [
        mediaItem('a', { insights: { viewCount: '5' } }),
        mediaItem('b', {
          locationAssociation: { category: 'INTERIOR' },
          insights: { viewCount: '20' },
          attribution: { profileName: 'Budi' },
        }),
        mediaItem('c', {
          insights: { viewCount: '1' },
          attribution: { profileName: 'Ani' },
        }),
      ],
    });

    const result = await GoogleBusinessService.listMedia('accounts/1/locations/10', {
      category: 'PRODUCT',
      source: 'customer',
      q: 'ani',
      sort: 'views',
      pageSize: 1,
    });

    expect(result.pagination).toEqual({ page: 1, pageSize: 1, total: 1, totalPages: 1 });
    expect(result.mediaItems[0].name).toContain('/c');
    // Ringkasan memakai seluruh data lokasi, bukan hasil filter.
    expect(result.summary).toMatchObject({ total: 3, owner: 1, customer: 2, totalViews: 26 });
  });

  test('paging dijepit ke halaman terakhir', async () => {
    GoogleBusinessClient.get.mockResolvedValueOnce({
      mediaItems: Array.from({ length: 5 }, (_, i) => mediaItem(`m${i}`, {
        createTime: `2026-01-0${i + 1}T00:00:00Z`,
      })),
    });

    const result = await GoogleBusinessService.listMedia('accounts/1/locations/11', {
      page: 9,
      pageSize: 2,
    });

    expect(result.pagination).toEqual({ page: 3, pageSize: 2, total: 5, totalPages: 3 });
    expect(result.mediaItems).toHaveLength(1);
  });

  test('cache 10 menit dipakai, refresh=1 memaksa panggil ulang', async () => {
    GoogleBusinessClient.get.mockResolvedValue({ mediaItems: [mediaItem('x')] });

    await GoogleBusinessService.listMedia('accounts/1/locations/12');
    await GoogleBusinessService.listMedia('accounts/1/locations/12');
    expect(GoogleBusinessClient.get).toHaveBeenCalledTimes(1);

    await GoogleBusinessService.listMedia('accounts/1/locations/12', { refresh: true });
    expect(GoogleBusinessClient.get).toHaveBeenCalledTimes(2);
  });
});

describe('Google Business Media — upload', () => {
  test('bytes: startUpload → upload → create dengan dataRef', async () => {
    GoogleBusinessClient.post
      .mockResolvedValueOnce({ resourceName: 'upload-1' })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ name: `${LOCATION}/media/baru` });

    const buffer = Buffer.from('gambar');
    const result = await GoogleBusinessService.uploadPhoto(LOCATION, {
      buffer,
      mimeType: 'image/png',
      category: 'PRODUCT',
      description: '  Buket mawar  ',
    });

    expect(result.name).toContain('/media/baru');
    expect(GoogleBusinessClient.post.mock.calls[0][0]).toContain('media:startUpload');
    expect(GoogleBusinessClient.post.mock.calls[1][0]).toContain('/upload/v1/media/upload-1?uploadType=media');
    expect(GoogleBusinessClient.post.mock.calls[1][1]).toBe(buffer);
    expect(GoogleBusinessClient.post.mock.calls[1][2]).toEqual({ headers: { 'Content-Type': 'image/png' } });
    expect(GoogleBusinessClient.post.mock.calls[2][1]).toEqual({
      mediaFormat: 'PHOTO',
      locationAssociation: { category: 'PRODUCT' },
      description: 'Buket mawar',
      dataRef: { resourceName: 'upload-1' },
    });
  });

  test('URL publik memakai sourceUrl tanpa startUpload', async () => {
    GoogleBusinessClient.post.mockResolvedValueOnce({ name: `${LOCATION}/media/url` });

    await GoogleBusinessService.uploadPhoto(LOCATION, {
      photoUrl: 'https://example.com/foto.jpg',
      category: 'EXTERIOR',
    });

    expect(GoogleBusinessClient.post).toHaveBeenCalledTimes(1);
    expect(GoogleBusinessClient.post.mock.calls[0][1]).toEqual({
      mediaFormat: 'PHOTO',
      locationAssociation: { category: 'EXTERIOR' },
      sourceUrl: 'https://example.com/foto.jpg',
    });
  });

  test('deskripsi tidak dikirim untuk COVER', async () => {
    GoogleBusinessClient.post.mockResolvedValueOnce({ name: `${LOCATION}/media/profile` });

    await GoogleBusinessService.uploadPhoto(LOCATION, {
      photoUrl: 'https://example.com/cover.jpg',
      category: 'COVER',
      description: 'tidak boleh',
    });

    expect(GoogleBusinessClient.post.mock.calls[0][1].description).toBeUndefined();
  });

  test('kategori di luar enum ditolak', async () => {
    await expect(
      GoogleBusinessService.uploadPhoto(LOCATION, { photoUrl: 'https://example.com/a.jpg', category: 'LOGO' })
    ).rejects.toThrow('Kategori foto tidak valid');
  });

  test('kegagalan startUpload diteruskan', async () => {
    GoogleBusinessClient.post.mockResolvedValueOnce({ error: { status: 403, message: 'denied' } });

    const result = await GoogleBusinessService.uploadPhoto(LOCATION, {
      buffer: Buffer.from('x'),
      category: 'ADDITIONAL',
    });

    expect(result.error.status).toBe(403);
  });
});

describe('Google Business Media — edit & path', () => {
  test('patch kategori memakai updateMask yang benar', async () => {
    GoogleBusinessClient.patch.mockResolvedValueOnce({ name: `${LOCATION}/media/a` });

    await GoogleBusinessService.updateMediaCategory(`${LOCATION}/media/a`, 'INTERIOR');

    expect(GoogleBusinessClient.patch).toHaveBeenCalledWith(
      `https://mybusiness.googleapis.com/v4/${LOCATION}/media/a?updateMask=locationAssociation.category`,
      { locationAssociation: { category: 'INTERIOR' } }
    );
  });

  test('patch ke COVER/PROFILE ditolak', async () => {
    await expect(
      GoogleBusinessService.updateMediaCategory(`${LOCATION}/media/a`, 'COVER')
    ).rejects.toThrow('COVER/PROFILE');
  });

  test('resolveMediaPath menolak path traversal', () => {
    expect(resolveMediaPath('public/uploads/media/foto.jpg')).toContain('public');
    expect(() => resolveMediaPath('../../.env')).toThrow('Path media tidak valid');
  });
});
