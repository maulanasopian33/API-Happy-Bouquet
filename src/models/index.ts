import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { initUser } from './User';
import { initMaterial } from './Material';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable] as string, config)
  : new Sequelize(config.database, config.username, config.password, config);

const db = {
  sequelize,
  Sequelize,
  User: initUser(sequelize),
  Material: initMaterial(sequelize),
};

export default db;
