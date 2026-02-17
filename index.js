const config = require('./config/index.config');
const ManagersLoader = require('./loaders/ManagersLoader');
const App = require('./app');
const mongoose = require('mongoose');
const isTestEnv = config.dotEnv.ENV === 'test';

const createNoopCache = () => ({
  string: {
    get: async () => null,
    set: async () => true,
    delete: async () => true,
    exists: async () => false,
    expire: async () => true,
  },
  hash: {
    get: async () => ({}),
    set: async () => true,
    delete: async () => true,
    incrby: async () => 0,
    setField: async () => true,
    getField: async () => null,
    getFields: async () => ({}),
  },
  set: {
    add: async () => true,
    remove: async () => true,
    get: async () => [],
    has: async () => false,
  },
  sorted: {
    get: async () => [],
    update: async () => true,
    set: async () => true,
    incrBy: async () => true,
    remove: async () => true,
  },
});

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:');
  console.log(err, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled rejection at ', promise, 'reason:', reason);
  process.exit(1);
});

const cache = isTestEnv
  ? createNoopCache()
  : require('./cache/cache.dbh')({
    prefix: config.dotEnv.CACHE_PREFIX,
    url: config.dotEnv.CACHE_REDIS,
  });

const mongoDB = isTestEnv
  ? mongoose.connection
  : require('./connect/mongo')({
    uri: config.dotEnv.MONGO_URI,
  });

if (config.dotEnv.ENV === 'development') {
  const runSeeds = async () => {
    try {
      const SeedLoader = require('./loaders/SeedLoader');
      const seedLoader = new SeedLoader({ cache });
      await seedLoader.seed();
    } catch (error) {
      console.error('Failed to seed database:', error);
    }
  };

  if (mongoose.connection.readyState === 1) {
    runSeeds();
  } else {
    mongoose.connection.once('connected', runSeeds);
  }
}

const managersLoader = new ManagersLoader({ config, cache });
const managers = managersLoader.load();

const appInstance = new App({ managers });
const app = appInstance.getApp();

let server;

const startServer = () => {
  if (server) {
    return server;
  }

  const PORT = config.dotEnv.PORT || 3000;
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${config.dotEnv.ENV}`);
    console.log(`💾 MongoDB: ${config.dotEnv.MONGO_URI}`);
    console.log(`🔴 Redis: ${config.dotEnv.CACHE_REDIS}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      mongoDB.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });

  return server;
};

if (require.main === module && config.dotEnv.ENV !== 'test') {
  startServer();
}

module.exports = app;
