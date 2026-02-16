require('dotenv').config();
const pjson = require('../package.json');

const SERVICE_NAME = process.env.SERVICE_NAME || pjson.name;
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || process.env.ENV || 'development';
const REDIS_URI = process.env.REDIS_URI || 'redis://127.0.0.1:6379';

const CACHE_REDIS = process.env.CACHE_REDIS || REDIS_URI;
const CACHE_PREFIX = process.env.CACHE_PREFIX || `${SERVICE_NAME}:ch`;

const MONGO_URI = process.env.MONGO_URI || `mongodb://localhost:27017/${SERVICE_NAME}`;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

const config = require(`./envs/${ENV}.js`);

config.dotEnv = {
  SERVICE_NAME,
  ENV,
  PORT,
  CACHE_REDIS,
  CACHE_PREFIX,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
};

module.exports = config;
