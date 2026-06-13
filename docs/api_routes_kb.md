# Knowledge Base — Dokumentasi API Route Happy Bouquet v2.0

Dokumen ini mendokumentasikan seluruh rute API backend pada Happy Bouquet v2.0, mencakup modul core dan modul baru (Reseller, Invoice, dan Notifikasi).

---

## 1. STANDAR HEADER & RESPONSE

### Standar Header
* **Content-Type**: `application/json` (atau `multipart/form-data` untuk upload file)
* **Authorization**: `Bearer <JWT_ACCESS_TOKEN>` (diperlukan untuk semua rute terproteksi)

### Standar Response Sukses (Format Umum)
```json
{
  "success": true,
  "message": "Pesan deskripsi keberhasilan operasi.",
  "data": { ... } // Berupa objek detail atau array list data
}
```

### Standar Response Error (Format Umum)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE", // e.g., VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND
    "message": "Deskripsi kesalahan yang terjadi.",
    "details": [] // Detail error validasi field (opsional)
  }
}
```

---

## 2. MODUL AUTENTIKASI & AKUN

### 2.1 Register Reseller Baru
* **URL**: `/api/reseller/register`
* **Method**: `POST`
* **Auth**: Tidak Butuh (Public)
* **Payload**:
```json
{
  "name": "Sari Flower Shop",
  "email": "sari@flower.com",
  "password": "securepassword123",
  "whatsapp_number": "081234567890",
  "slug": "sari-flower",
  "shop_name": "Toko Bunga Sari",
  "shop_bio": "Penyedia Bouquet Premium di Kota Jakarta"
}
```
* **Respon Sukses (201 Created)**:
```json
{
  "success": true,
  "message": "Pendaftaran reseller berhasil. Akun Anda sedang dalam peninjauan admin.",
  "data": {
    "id": 5,
    "user_id": 12,
    "slug": "sari-flower",
    "shop_name": "Toko Bunga Sari",
    "whatsapp_number": "081234567890",
    "status": "pending_review",
    "tier": "silver"
  }
}
```

### 2.2 Login (Multi-Role)
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Auth**: Tidak Butuh (Public)
* **Payload**:
```json
{
  "email": "admin@happybouquet.com",
  "password": "password123"
}
```
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIi...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@happybouquet.com",
      "role": "admin"
    }
  }
}
```

---

## 3. MODUL INVOICE

### 3.1 Ambil Data Invoice
* **URL**: `/api/invoices/:orderId`
* **Method**: `GET`
* **Auth**: Butuh (Role: `admin`, `super_admin`, `staff`, atau pemilik order terkait)
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Invoice berhasil diambil",
  "data": {
    "id": 1,
    "invoice_number": "INV-2026-06-0001",
    "order_id": 15,
    "total_amount": 150000.00,
    "pdf_file_path": "/uploads/invoices/INV_2026_06_0001.pdf",
    "issued_at": "2026-06-13T13:00:00.000Z",
    "createdAt": "2026-06-13T13:00:00.000Z"
  }
}
```

### 3.2 Unduh File PDF Invoice
* **URL**: `/api/invoices/:orderId/download`
* **Method**: `GET`
* **Auth**: Butuh (Role: `admin`, `super_admin`, `staff`, atau pemilik order terkait)
* **Respon Sukses (200 OK)**:
  * Mengembalikan file physical binary PDF attachment dengan nama `INV-YYYY-MM-xxxx.pdf` untuk langsung diunduh oleh browser client.

---

## 4. MODUL NOTIFIKASI

### 4.1 Ambil Log Notifikasi User
* **URL**: `/api/notifications`
* **Method**: `GET`
* **Auth**: Butuh (Semua User)
* **Query Params**:
  * `page` (default: `1`)
  * `limit` (default: `20`)
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Notifikasi berhasil diambil",
  "data": {
    "logs": [
      {
        "id": "1",
        "user_id": 5,
        "recipient": "customer@test.com",
        "channel": "in_app",
        "template_code": "order_confirmed",
        "subject": null,
        "body": "Pembayaran untuk pesanan ORD-20260613-001 telah dikonfirmasi.",
        "status": "sent",
        "sent_at": "2026-06-13T13:02:15.000Z",
        "createdAt": "2026-06-13T13:02:15.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

---

## 5. PANEL ADMIN — KELOLA KEMITRAAN RESELLER

### 5.1 Daftar Semua Reseller
* **URL**: `/api/admin/resellers`
* **Method**: `GET`
* **Auth**: Butuh (Role: `admin`, `super_admin`)
* **Query Params**:
  * `status` (e.g. `pending_review`, `active`, `suspended`, `rejected`)
  * `tier` (e.g. `silver`, `gold`, `platinum`)
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar reseller berhasil diambil",
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "slug": "mawar-indah",
      "shop_name": "Mawar Indah Toko",
      "whatsapp_number": "08123456789",
      "tier": "silver",
      "status": "pending_review",
      "user": {
        "name": "Reseller Mawar",
        "email": "reseller@mawar.com",
        "phone": "08123456789"
      }
    }
  ]
}
```

### 5.2 Setujui (Approve) Reseller
* **URL**: `/api/admin/resellers/:id/approve`
* **Method**: `PATCH`
* **Auth**: Butuh (Role: `admin`, `super_admin`)
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Reseller approved",
  "data": {
    "id": 1,
    "status": "active",
    "approved_at": "2026-06-13T13:04:00.000Z"
  }
}
```

### 5.3 Tolak (Reject) Reseller
* **URL**: `/api/admin/resellers/:id/reject`
* **Method**: `PATCH`
* **Auth**: Butuh (Role: `admin`, `super_admin`)
* **Payload**:
```json
{
  "reason": "Nomor WhatsApp tidak valid atau tidak aktif."
}
```
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Reseller rejected",
  "data": {
    "id": 1,
    "status": "rejected",
    "rejection_reason": "Nomor WhatsApp tidak valid atau tidak aktif."
  }
}
```

### 5.4 Konfigurasi Harga Berjenjang Produk (Tier Price)
* **URL**: `/api/admin/reseller-tier-prices`
* **Method**: `POST`
* **Auth**: Butuh (Role: `admin`, `super_admin`)
* **Payload**:
```json
{
  "product_id": 2,
  "prices": [
    { "tier": "silver", "reseller_price": 135000 },
    { "tier": "gold", "reseller_price": 120000 },
    { "tier": "platinum", "reseller_price": 110000 }
  ]
}
```
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Harga tier reseller berhasil disimpan"
}
```

### 5.5 Toggle Visibilitas Produk Reseller
* **URL**: `/api/admin/products/:id/resellable`
* **Method**: `PATCH`
* **Auth**: Butuh (Role: `admin`, `super_admin`)
* **Payload**:
```json
{
  "is_resellable": true
}
```
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Otorisasi visibilitas produk reseller berhasil diperbarui."
}
```

---

## 6. PANEL RESELLER — TOKO & PELANGGAN

### 6.1 Ambil Statistik Dashboard Reseller
* **URL**: `/api/reseller/dashboard`
* **Method**: `GET`
* **Auth**: Butuh (Role: `reseller`)
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Dashboard statistik berhasil diambil",
  "data": {
    "shop_name": "Toko Bunga Indah",
    "tier": "silver",
    "status": "active",
    "total_orders": 14,
    "earnings": {
      "earned": 450000,
      "pending": 90000,
      "total": 540000
    },
    "recent_orders": [ ... ]
  }
}
```

### 6.2 Buat Client CRM Baru
* **URL**: `/api/reseller/clients`
* **Method**: `POST`
* **Auth**: Butuh (Role: `reseller`)
* **Payload**:
```json
{
  "name": "Budi Santoso",
  "phone": "085234567890",
  "email": "budi@gmail.com",
  "address": "Jl. Melati No. 45",
  "city": "Bandung",
  "notes": "Pelanggan loyal, suka buket mawar merah"
}
```
* **Respon Sukses (201 Created)**:
```json
{
  "success": true,
  "message": "Client berhasil ditambahkan",
  "data": {
    "id": 8,
    "reseller_id": 2,
    "name": "Budi Santoso",
    "phone": "085234567890",
    "total_orders": 0
  }
}
```

### 6.3 Buat Order Reseller ke Admin
* **URL**: `/api/reseller/orders`
* **Method**: `POST`
* **Auth**: Butuh (Role: `reseller`)
* **Payload**:
```json
{
  "product_id": 2,
  "quantity": 1,
  "client_id": 8, // opsional jika menggunakan database client CRM
  "client_name": "Budi Santoso",
  "client_phone": "085234567890",
  "client_address": "Jl. Melati No. 45",
  "reseller_notes": "Mohon pita buket diganti dengan warna biru tua",
  "notes": "Pesanan client Budi"
}
```
* **Respon Sukses (201 Created)**:
```json
{
  "success": true,
  "message": "Order reseller berhasil dibuat",
  "data": {
    "id": 25,
    "order_code": "ORD-20260613-025",
    "total_price": 120000.00, // Harga snapshot sesuai tier reseller
    "status": "pending",
    "payment_status": "unpaid"
  }
}
```

### 6.4 Upload Bukti Pembayaran Order Reseller
* **URL**: `/api/reseller/orders/:id/upload-payment`
* **Method**: `POST`
* **Auth**: Butuh (Role: `reseller`)
* **Headers**: `Content-Type: multipart/form-data`
* **Body Form-Data**:
  * `payment_proof`: (File Gambar, Max 5MB)
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Bukti pembayaran berhasil diunggah",
  "data": {
    "id": 25,
    "payment_proof_url": "/uploads/payments/pay_ORD_20260613_025_171828.png"
  }
}
```

### 6.5 Ambil Laporan Komisi/Earning Reseller
* **URL**: `/api/reseller/earnings`
* **Method**: `GET`
* **Auth**: Butuh (Role: `reseller`)
* **Query Params**:
  * `status` (e.g. `pending`, `earned`, `cancelled`)
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Daftar perolehan margin laba berhasil diambil",
  "data": [
    {
      "id": 1,
      "order_id": 25,
      "reseller_price": "120000.00",
      "public_price": "150000.00",
      "margin_per_unit": "30000.00",
      "total_margin": "30000.00",
      "status": "pending",
      "earned_at": null
    }
  ]
}
```

---

## 7. KATALOG PUBLIK RESELLER (PUBLIC — NO AUTH)

### 7.1 Ambil Detail Toko & Katalog
* **URL**: `/api/catalog/:slug`
* **Method**: `GET`
* **Auth**: Tidak Butuh (Public)
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Katalog berhasil diambil",
  "data": {
    "reseller": {
      "shop_name": "Toko Bunga Indah",
      "shop_bio": "Spesialis karangan bunga segar",
      "whatsapp_number": "08123456789",
      "catalogSetting": {
        "accent_color": "#FF6B9D",
        "custom_cta_text": "Pesan via WhatsApp",
        "announcement_text": "Diskon 10% untuk pemesanan pertama!",
        "is_closed": false
      }
    },
    "products": [
      {
        "id": 2,
        "name": "Buket Mawar Premium",
        "price": 150000.00, // Menampilkan harga publik eceran untuk customer
        "photo_url": "/uploads/products/rose.jpg"
      }
    ]
  }
}
```

### 7.2 Ambil Tautan Template WhatsApp Generator
* **URL**: `/api/catalog/:slug/whatsapp-link/:productId`
* **Method**: `GET`
* **Auth**: Tidak Butuh (Public)
* **Respon Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Link WhatsApp berhasil dibuat",
  "data": {
    "whatsapp_url": "https://wa.me/628123456789?text=Halo+kak+Toko+Bunga+Indah%2C+saya+ingin+pesan%3A%0A%F0%9F%8C%B8+Buket+Mawar+Premium%0A%F0%9F%92%B0+Rp+150.000",
    "message_preview": "Halo kak Toko Bunga Indah, saya ingin pesan:\n🌸 Buket Mawar Premium\n💰 Rp 150.000",
    "reseller_phone": "628123456789"
  }
}
```
