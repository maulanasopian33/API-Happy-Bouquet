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

dotenv.config();

import configData from '../config/config';

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
};

export default db;
