const config = require('./config/index.config');
const ManagersLoader = require('./loaders/ManagersLoader');
const App = require('./app');
const mongoose = require('mongoose');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:');
  console.log(err, err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled rejection at ', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize cache
const cache = require('./cache/cache.dbh')({
  prefix: config.dotEnv.CACHE_PREFIX,
  url: config.dotEnv.CACHE_REDIS,
});

// Initialize MongoDB connection
const mongoDB = require('./connect/mongo')({
  uri: config.dotEnv.MONGO_URI,
});

// Run seeds in development mode only
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

  // Run seeds when connection is established
  if (mongoose.connection.readyState === 1) {
    // Already connected
    runSeeds();
  } else {
    // Wait for connection
    mongoose.connection.once('connected', runSeeds);
  }
}

// Initialize managers
const managersLoader = new ManagersLoader({ config, cache });
const managers = managersLoader.load();

// Initialize Express app
const appInstance = new App({ managers });
const app = appInstance.getApp();

// Start server
const PORT = config.dotEnv.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.dotEnv.ENV}`);
  console.log(`💾 MongoDB: ${config.dotEnv.MONGO_URI}`);
  console.log(`🔴 Redis: ${config.dotEnv.CACHE_REDIS}`);
});

// Graceful shutdown
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

module.exports = app;
