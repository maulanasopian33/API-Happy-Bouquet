'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('NotificationTemplates', [
      // In-App Templates
      {
        code: 'order_placed',
        channel: 'in_app',
        subject: null,
        body: 'Pesanan baru {order_code} telah masuk.',
        is_active: true,
        createdAt: new Date()
      },
      {
        code: 'order_confirmed',
        channel: 'in_app',
        subject: null,
        body: 'Pembayaran untuk pesanan {order_code} telah dikonfirmasi.',
        is_active: true,
        createdAt: new Date()
      },
      {
        code: 'order_status_changed',
        channel: 'in_app',
        subject: null,
        body: 'Status pesanan {order_code} diubah menjadi {status}.',
        is_active: true,
        createdAt: new Date()
      },
      {
        code: 'low_stock',
        channel: 'in_app',
        subject: null,
        body: 'Peringatan: Stok bahan {material_name} menipis ({stock} unit tersisa).',
        is_active: true,
        createdAt: new Date()
      },
      {
        code: 'reseller_registered',
        channel: 'in_app',
        subject: null,
        body: 'Pendaftaran reseller baru dari {reseller_name} (status: pending).',
        is_active: true,
        createdAt: new Date()
      },
      {
        code: 'reseller_approved',
        channel: 'in_app',
        subject: null,
        body: 'Selamat! Pendaftaran reseller Anda telah disetujui.',
        is_active: true,
        createdAt: new Date()
      },
      {
        code: 'reseller_rejected',
        channel: 'in_app',
        subject: null,
        body: 'Maaf, pendaftaran reseller Anda ditolak. Alasan: {reason}.',
        is_active: true,
        createdAt: new Date()
      },

      // Email Templates
      {
        code: 'reseller_welcome',
        channel: 'email',
        subject: 'Selamat Bergabung di Kemitraan Happy Bouquet!',
        body: 'Halo {reseller_name},\n\nSelamat! Akun reseller Anda telah aktif. Anda sekarang dapat mengakses katalog publik Anda di: {catalog_url} dan masuk ke panel reseller Anda.\n\nSalam,\nHappy Bouquet',
        is_active: true,
        createdAt: new Date()
      },
      {
        code: 'order_invoice',
        channel: 'email',
        subject: 'Invoice Pembelian Anda - {invoice_number}',
        body: 'Halo {customer_name},\n\nTerima kasih atas pembelian Anda. Terlampir invoice {invoice_number} untuk pesanan {order_code}.\n\nAnda dapat mengunduh invoice Anda kapan saja di panel Anda.\n\nSalam,\nHappy Bouquet',
        is_active: true,
        createdAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('NotificationTemplates', null, {});
  }
};
