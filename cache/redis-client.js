const Redis = require('ioredis');

const runTest = async (redis, prefix) => {
  const key = `${prefix}:test:${new Date().getTime()}`;
  await redis.set(key, 'Redis Test Done.');
  const data = await redis.get(key);
  console.log(`✅ Cache Test Data: ${data}`);
  await redis.del(key);
};

const createClient = ({ prefix, url }) => {
  console.log(`🔗 Connecting to Redis: ${url} with prefix: ${prefix}`);

  const redis = new Redis(url, {
    keyPrefix: prefix + ':',
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  // Register client events
  redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
  });

  redis.on('connect', () => {
    console.log('✅ Redis client connected');
  });

  redis.on('ready', () => {
    console.log('✅ Redis client ready');
    runTest(redis, prefix);
  });

  redis.on('end', () => {
    console.log('⚠️  Redis connection ended');
  });

  redis.on('close', () => {
    console.log('⚠️  Redis connection closed');
  });

  return redis;
};

exports.createClient = createClient;
