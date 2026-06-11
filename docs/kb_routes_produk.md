# KNOWLEDGE BASE: INTEGRASI API PRODUK & KATALOG (FRONTEND)
Dokumen ini disusun untuk memudahkan tim Frontend (FE) dalam mengintegrasikan fitur katalog, produk, kategori, banner, promo, dan sistem pemesanan pada aplikasi **Happy Bouquet**.

---

## 1. STRUKTUR GLOBAL & OTENTIKASI

### 1.1 Base URL & Environment
- **Development**: `http://localhost:5000/api`
- **Asset / Upload Path**: `http://localhost:5000` (Gunakan prefix ini sebelum path gambar, contoh: `/public/uploads/red-roses.png` menjadi `http://localhost:5000/public/uploads/red-roses.png`)

### 1.2 Format Global API Response
Semua endpoint mengembalikan format JSON terstandardisasi berikut:

#### Respon Sukses (HTTP 200/201)
```json
{
  "status": true,
  "message": "Daftar produk berhasil diambil",
  "data": { ... }, // Objek atau Array data
  "error": null
}
```

#### Respon Gagal (HTTP 400/401/404/422)
```json
{
  "status": false,
  "message": "Validasi gagal / Token tidak valid",
  "data": null,
  "error": { ... } // Detail error atau objek validasi (contoh: Zod error)
}
```

### 1.3 Keamanan & Token JWT
Beberapa rute administratif memerlukan token JWT di Header HTTP:
```http
Authorization: Bearer <your_jwt_token>
```
> [!IMPORTANT]
> - Middleware `authMiddleware` mendeteksi token tidak valid dan mengembalikan status **401 Unauthorized**. 
> - Frontend harus mendeteksi status **401** dan menghapus token lokal lalu me-redirect user ke halaman `/login`.

---

## 2. API UTAMA: PRODUK (`/api/products`)

### 2.1 Ambil Semua Produk (Public & Admin)
Mengambil daftar produk yang tersedia. Secara default, endpoint ini menyembunyikan rincian biaya (`costTemplates`) untuk alasan privasi publik.

- **Method**: `GET`
- **Endpoint**: `/api/products`
- **Query Parameters**:
  - `active` *(boolean)*: Jika `true`, hanya mengambil produk aktif. (Rekomendasi untuk FE Katalog: `active=true`)
  - `category_id` *(number)*: Filter produk berdasarkan ID Kategori.
  - `include_costs` *(boolean)*: Mengembalikan data cost (Hanya berfungsi jika melampirkan token Admin valid).
  
#### Contoh Request (Katalog Publik):
```http
GET /api/products?active=true&category_id=1
```

#### Contoh Respon Data:
```json
{
  "status": true,
  "message": "Daftar produk berhasil diambil",
  "data": [
    {
      "id": 1,
      "name": "Buket Mawar Merah Eksklusif - Edisi 1",
      "slug": "buket-mawar-merah-eksklusif-edisi-1",
      "description": "Buket bunga mawar merah segar pilihan, dirangkai dengan cantik dan elegan, cocok untuk hadiah ulang tahun atau hari kasih sayang.",
      "price": 150000.00,
      "photo_url": "/public/uploads/red-roses.png",
      "category_id": 1,
      "type": "ready",
      "preorder_duration": null,
      "is_active": true,
      "createdAt": "2026-05-27T02:24:28.000Z",
      "updatedAt": "2026-05-27T02:24:28.000Z",
      "category": {
        "id": 1,
        "name": "Buket Bunga",
        "icon": "Flower"
      },
      "orderChannels": [
        {
          "id": 1,
          "name": "WhatsApp",
          "icon_url": "https://cdn-icons-png.flaticon.com/512/733/733585.png",
          "ProductOrderChannel": {
            "product_id": 1,
            "channel_id": 1,
            "store_url": "https://wa.me/628123456789?text=Halo%20saya%20ingin%20order%20Buket%20Mawar"
          }
        }
      ]
    }
  ],
  "error": null
}
```

---

### 2.2 Ambil Detail Produk berdasarkan ID
- **Method**: `GET`
- **Endpoint**: `/api/products/:id` (ID harus numerik)
- **Contoh**: `/api/products/1`

---

### 2.3 Ambil Detail Produk berdasarkan Slug (Sangat Direkomendasikan untuk URL FE)
Untuk SEO dan URL yang ramah pengguna, FE sebaiknya menggunakan endpoint berbasis slug untuk halaman detail produk.

- **Method**: `GET`
- **Endpoint**: `/api/products/slug/:slug`
- **Contoh**: `/api/products/slug/buket-mawar-merah-eksklusif-edisi-1`

#### Contoh Respon:
Mengembalikan objek produk lengkap, termasuk asosiasi Kategori (`category`) dan Saluran Pemesanan (`orderChannels`).

---

### 2.4 Sistem Pre-order & Jenis Produk
Setiap produk memiliki field `type` dan `preorder_duration`:
- **`type` = `ready`**: Produk siap dikirim, stok fisik tersedia langsung.
- **`type` = `preorder`**: Produk memerlukan perangkaian khusus. Field `preorder_duration` menunjukkan waktu pembuatan dalam satuan hari.
  
> [!TIP]
> **Pedoman UI Frontend**:
> - Jika `type === 'preorder'`, tampilkan label badge **"Pre-Order (X Hari)"** di atas produk.
> - Informasikan estimasi waktu pengiriman kepada pembeli saat check out.

---

### 2.5 Order Channels (WhatsApp / Shopee)
Produk di Happy Bouquet tidak selalu dicheckout langsung di web API, namun bisa diarahkan ke link WhatsApp or Shopee. Relasi ini disimpan di array `orderChannels` produk.

- **Cara Integrasi di FE**:
  - Periksa apakah produk memiliki `orderChannels` di dalam respon.
  - Tampilkan tombol order eksternal dinamis dengan ikon (dari `icon_url`) dan href (dari `ProductOrderChannel.store_url`).
  - Bila channel kosong, default-kan order langsung via sistem web utama (jika diaktifkan).

---

## 3. SUPPORTING ENDPOINTS (ECOMMERCE & NAVIGATION)

Frontend membutuhkan data navigasi, banner promosi, dan kupon diskon dinamis untuk mempercantik halaman beranda (Landing Page).

### 3.1 Kategori (`/api/categories`)
Menyediakan daftar kategori buket bunga untuk tombol navigasi filter di halaman utama.

- **Method**: `GET`
- **Endpoint**: `/api/categories`
- **Data Model**:
  - `id` *(number)*
  - `name` *(string)*: Nama kategori (Contoh: "Buket Bunga", "Buket Uang", "Buket Snack", "Hampers").
  - `icon` *(string)*: Kode nama ikon Lucide (Contoh: "Flower", "Banknote", "Cookie", "Gift"). FE bisa memetakan string ini langsung ke komponen ikon SVG Lucide-React / Lucide-Vue.

---

### 3.2 Hero Banner (`/api/banners`)
Menyediakan banner dinamis berputar (carousel) di bagian atas Landing Page.

- **Method**: `GET`
- **Endpoint**: `/api/banners`
- **Data Model**:
  - `id` *(number)*
  - `title` *(string)*: Judul promosi banner.
  - `imageUrl` *(string)*: Path gambar banner (Contoh: `/public/uploads/banner-1.jpg`).
  - `link` *(string)*: Href tujuan ketika banner di-klik (Contoh: `/category/1`).
  - `order` *(number)*: Urutan tampilan banner (1, 2, dst).

---

### 3.3 Promosi & Kupon (`/api/promos`)
Menampilkan daftar promo aktif atau memvalidasi kupon potongan harga saat proses checkout.

- **Method**: `GET`
- **Endpoint**: `/api/promos`
- **Data Model**:
  - `id` *(uuid)*
  - `name` *(string)*: Nama promosi (Contoh: "Diskon Pengguna Baru").
  - `code` *(string)*: Kode kupon (Contoh: "HAPPYNEW").
  - `type` *(enum)*: `'percentage'` (persen) atau `'fixed_amount'` (nominal tetap).
  - `value` *(number)*: Besar potongan (Contoh: `10` untuk 10% atau `25000` untuk potongan Rp 25.000).
  - `minOrderAmount` *(number)*: Minimal belanja untuk menerapkan kupon.
  - `status` *(string)*: `'active'` atau lainnya.

---

## 4. ADMINISTRATOR / BACK-OFFICE ENDPOINTS (TINDAKAN WRITE)

Akses ini memerlukan login dan pengiriman header `Authorization` yang valid.

### 4.1 Tambah Produk Baru
- **Method**: `POST`
- **Endpoint**: `/api/products`
- **Content-Type**: `multipart/form-data` (Karena menyertakan file gambar)
- **Fields**:
  - `name` *(string)*: Wajib.
  - `description` *(string)*: Opsional.
  - `price` *(number)*: Wajib (contoh: 150000).
  - `category_id` *(number)*: Opsional.
  - `type` *(enum)*: `'ready'` atau `'preorder'`.
  - `preorder_duration` *(number)*: Diisi jika type preorder.
  - `photo` *(file)*: File gambar produk (diupload ke multer).

### 4.2 Update Produk
- **Method**: `PUT`
- **Endpoint**: `/api/products/:id`
- **Content-Type**: `multipart/form-data` atau `application/json`

### 4.3 Menghubungkan Channel Pembelian ke Produk
- **Method**: `POST`
- **Endpoint**: `/api/products/:id/channels`
- **Content-Type**: `application/json`
- **Payload**:
```json
[
  {
    "channel_id": 1,
    "store_url": "https://wa.me/628123456789?text=Halo%20saya%20tertarik..."
  }
]
```

### 4.4 Pengelolaan Template Biaya / COGS (Admin Only)
Endpoint untuk memetakan HPP (Harga Pokok Penjualan) per produk.
- **`GET /api/products/:id/cost-templates`**: Mengambil daftar biaya produksi.
- **`POST /api/products/:id/cost-templates`**: Tambah daftar biaya bulk (Tipe: `material`, `labor`, `overhead`).
- **`DELETE /api/products/:id/cost-templates/:templateId`**: Hapus entri biaya.

---

## 5. CONTOH IMPLEMENTASI FRONTEND (AXIOS & VUE 3)

Berikut adalah snippet standar integrasi API di Frontend menggunakan **Axios** dan **Composition API (Vue 3)**.

### 5.1 Axios API Service (`api.js`)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

// Interceptor untuk menyertakan JWT token secara otomatis
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor untuk merespon kegagalan otentikasi global (401)
api.interceptors.response.use(
  (response) => response.data, // langsung ambil format {status, message, data}
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      window.location.href = '/login';
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default api;
```

### 5.2 Menggunakan di Halaman Produk Katalog (`CatalogView.vue`)
```html
<template>
  <div class="catalog-container">
    <!-- Filter Kategori -->
    <div class="category-filters">
      <button 
        @click="selectCategory(null)" 
        :class="{ active: selectedCategory === null }"
      >
        Semua
      </button>
      <button 
        v-for="cat in categories" 
        :key="cat.id" 
        @click="selectCategory(cat.id)"
        :class="{ active: selectedCategory === cat.id }"
      >
        <span class="icon">{{ cat.icon }}</span> <!-- Bisa diubah jadi Lucide Icon -->
        {{ cat.name }}
      </button>
    </div>

    <!-- Daftar Produk -->
    <div v-if="loading" class="spinner">Memuat produk...</div>
    <div v-else class="product-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <!-- Pre-order badge -->
        <span v-if="product.type === 'preorder'" class="badge preorder">
          Pre-Order ({{ product.preorder_duration }} Hari)
        </span>
        
        <img :src="`http://localhost:5000${product.photo_url}`" :alt="product.name" class="product-image" />
        
        <h3>{{ product.name }}</h3>
        <p class="price">{{ formatCurrency(product.price) }}</p>
        
        <!-- Saluran Pembelian WhatsApp / Shopee -->
        <div class="order-actions">
          <a 
            v-for="channel in product.orderChannels" 
            :key="channel.id" 
            :href="channel.ProductOrderChannel.store_url" 
            target="_blank"
            class="btn-channel"
          >
            <img :src="channel.icon_url" :alt="channel.name" class="channel-icon" />
            Beli di {{ channel.name }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '@/services/api';

const categories = ref([]);
const products = ref([]);
const selectedCategory = ref(null);
const loading = ref(false);

const fetchCategories = async () => {
  try {
    const res = await api.get('/categories');
    if (res.status) categories.value = res.data;
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
};

const fetchProducts = async () => {
  loading.value = true;
  try {
    let url = '/products?active=true';
    if (selectedCategory.value) {
      url += `&category_id=${selectedCategory.value}`;
    }
    const res = await api.get(url);
    if (res.status) products.value = res.data;
  } catch (err) {
    console.error('Error fetching products:', err);
  } finally {
    loading.value = false;
  }
};

const selectCategory = (id) => {
  selectedCategory.value = id;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

// Refresh produk tiap kali filter kategori berganti
watch(selectedCategory, () => {
  fetchProducts();
});

onMounted(() => {
  fetchCategories();
  fetchProducts();
});
</script>
```
