import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { initUser } from './User';
import { initMaterial } from './Material';
import { initProduct } from './Product';
import { initProductCostTemplate } from './ProductCostTemplate';
import { initOrder } from './Order';
import { initOrderCostItem } from './OrderCostItem';
import { initFundAccount } from './FundAccount';
import { initFundTransaction } from './FundTransaction';
import { initProfitAllocation } from './ProfitAllocation';
import { initCategory } from './Category';
import { initPromo } from './Promo';
import { initHeroBanner } from './HeroBanner';
import { initOrderChannel } from './OrderChannel';
import { initProductOrderChannel } from './ProductOrderChannel';
import { initTiktokGlobalSetting } from './TiktokGlobalSetting';

// Reseller models
import { initReseller } from './Reseller';
import { initResellerTierPrice } from './ResellerTierPrice';
import { initResellerClient } from './ResellerClient';
import { initResellerWhatsappTemplate } from './ResellerWhatsappTemplate';
import { initResellerCatalogSetting } from './ResellerCatalogSetting';
import { initResellerEarning } from './ResellerEarning';
import { initResellerProductVisibility } from './ResellerProductVisibility';

// Invoice & Notification models
import { initInvoice } from './Invoice';
import { initNotificationTemplate } from './NotificationTemplate';
import { initNotificationLog } from './NotificationLog';

dotenv.config();

import configData = require('../config/config');

const env = (process.env.NODE_ENV || 'development') as keyof typeof configData;
const config = configData[env];

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable] as string, config)
  : new Sequelize(config.database, config.username, config.password, config);

const User = initUser(sequelize);
const Material = initMaterial(sequelize);
const Category = initCategory(sequelize); // Init before Product for associations
const Product = initProduct(sequelize);
const ProductCostTemplate = initProductCostTemplate(sequelize);
const Order = initOrder(sequelize);
const OrderCostItem = initOrderCostItem(sequelize);
const FundAccount = initFundAccount(sequelize);
const FundTransaction = initFundTransaction(sequelize);
const ProfitAllocation = initProfitAllocation(sequelize);
const Promo = initPromo(sequelize);
const HeroBanner = initHeroBanner(sequelize);
const OrderChannel = initOrderChannel(sequelize);
const ProductOrderChannel = initProductOrderChannel(sequelize);
const TiktokGlobalSetting = initTiktokGlobalSetting(sequelize);

// Initialize Reseller models
const Reseller = initReseller(sequelize);
const ResellerTierPrice = initResellerTierPrice(sequelize);
const ResellerClient = initResellerClient(sequelize);
const ResellerWhatsappTemplate = initResellerWhatsappTemplate(sequelize);
const ResellerCatalogSetting = initResellerCatalogSetting(sequelize);
const ResellerEarning = initResellerEarning(sequelize);
const ResellerProductVisibility = initResellerProductVisibility(sequelize);

// Initialize Invoice & Notification models
const Invoice = initInvoice(sequelize);
const NotificationTemplate = initNotificationTemplate(sequelize);
const NotificationLog = initNotificationLog(sequelize);

// ─── ASOSIASI ────────────────────────────────────────────────────

// Category ←→ Product
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Product ←→ ProductCostTemplate
Product.hasMany(ProductCostTemplate, { foreignKey: 'product_id', as: 'costTemplates' });
ProductCostTemplate.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User (customer) ←→ Order
User.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

// Product ←→ Order
Product.hasMany(Order, { foreignKey: 'product_id', as: 'orders' });
Order.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order ←→ OrderCostItem
Order.hasMany(OrderCostItem, { foreignKey: 'order_id', as: 'costItems' });
OrderCostItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// FundAccount ←→ FundTransaction
FundAccount.hasMany(FundTransaction, { foreignKey: 'fund_account_id', as: 'transactions' });
FundTransaction.belongsTo(FundAccount, { foreignKey: 'fund_account_id', as: 'fundAccount' });

// Order ←→ ProfitAllocation
Order.hasMany(ProfitAllocation, { foreignKey: 'order_id', as: 'profitAllocations' });
ProfitAllocation.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// FundAccount ←→ ProfitAllocation
FundAccount.hasMany(ProfitAllocation, { foreignKey: 'fund_account_id', as: 'profitAllocations' });
ProfitAllocation.belongsTo(FundAccount, { foreignKey: 'fund_account_id', as: 'fundAccount' });

// Product ←→ OrderChannel (Many-to-Many)
Product.belongsToMany(OrderChannel, {
  through: ProductOrderChannel,
  foreignKey: 'product_id',
  otherKey: 'channel_id',
  as: 'orderChannels'
});
OrderChannel.belongsToMany(Product, {
  through: ProductOrderChannel,
  foreignKey: 'channel_id',
  otherKey: 'product_id',
  as: 'products'
});

// User ←→ TiktokGlobalSetting
User.hasOne(TiktokGlobalSetting, { foreignKey: 'updated_by', as: 'tiktokGlobalSetting' });
TiktokGlobalSetting.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// ─── RESELLER ASSOCIATIONS ───────────────────────────────────────

// User ←→ Reseller
User.hasOne(Reseller, { foreignKey: 'user_id', as: 'reseller' });
Reseller.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (Admin) ←→ Reseller (Approved By)
User.hasMany(Reseller, { foreignKey: 'approved_by', as: 'approvedResellers' });
Reseller.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Reseller ←→ ResellerWhatsappTemplate
Reseller.hasOne(ResellerWhatsappTemplate, { foreignKey: 'reseller_id', as: 'whatsappTemplate' });
ResellerWhatsappTemplate.belongsTo(Reseller, { foreignKey: 'reseller_id', as: 'reseller' });

// Reseller ←→ ResellerCatalogSetting
Reseller.hasOne(ResellerCatalogSetting, { foreignKey: 'reseller_id', as: 'catalogSetting' });
ResellerCatalogSetting.belongsTo(Reseller, { foreignKey: 'reseller_id', as: 'reseller' });

// Reseller ←→ ResellerClient
Reseller.hasMany(ResellerClient, { foreignKey: 'reseller_id', as: 'clients' });
ResellerClient.belongsTo(Reseller, { foreignKey: 'reseller_id', as: 'reseller' });

// Reseller ←→ Order
Reseller.hasMany(Order, { foreignKey: 'reseller_id', as: 'orders' });
Order.belongsTo(Reseller, { foreignKey: 'reseller_id', as: 'reseller' });

// ResellerClient ←→ Order
ResellerClient.hasMany(Order, { foreignKey: 'client_id', as: 'orders' });
Order.belongsTo(ResellerClient, { foreignKey: 'client_id', as: 'client' });

// Reseller ←→ ResellerEarning
Reseller.hasMany(ResellerEarning, { foreignKey: 'reseller_id', as: 'earnings' });
ResellerEarning.belongsTo(Reseller, { foreignKey: 'reseller_id', as: 'reseller' });

// Order ←→ ResellerEarning
Order.hasMany(ResellerEarning, { foreignKey: 'order_id', as: 'resellerEarnings' });
ResellerEarning.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product ←→ ResellerTierPrice
Product.hasMany(ResellerTierPrice, { foreignKey: 'product_id', as: 'tierPrices' });
ResellerTierPrice.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product ←→ ResellerProductVisibility
Product.hasOne(ResellerProductVisibility, { foreignKey: 'product_id', as: 'visibility' });
ResellerProductVisibility.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product ←→ ResellerEarning
Product.hasMany(ResellerEarning, { foreignKey: 'product_id', as: 'resellerEarnings' });
ResellerEarning.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ─── INVOICE & NOTIFICATION ASSOCIATIONS ─────────────────────────

// Order ←→ Invoice
Order.hasOne(Invoice, { foreignKey: 'order_id', as: 'invoice' });
Invoice.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User ←→ NotificationLog
User.hasMany(NotificationLog, { foreignKey: 'user_id', as: 'notificationLogs' });
NotificationLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ─────────────────────────────────────────────────────────────────

const db = {
  sequelize,
  Sequelize,
  User,
  Material,
  Category,
  Product,
  ProductCostTemplate,
  Order,
  OrderCostItem,
  FundAccount,
  FundTransaction,
  ProfitAllocation,
  Promo,
  HeroBanner,
  OrderChannel,
  ProductOrderChannel,
  TiktokGlobalSetting,
  Reseller,
  ResellerTierPrice,
  ResellerClient,
  ResellerWhatsappTemplate,
  ResellerCatalogSetting,
  ResellerEarning,
  ResellerProductVisibility,
  Invoice,
  NotificationTemplate,
  NotificationLog,
};

export default db;
