const { performance } = require('perf_hooks');

const keyCheck = (key) => {
  if (!key) throw new Error('Cache Key is missing');
};

module.exports = ({ prefix, url }) => {
  if (!prefix || !url) throw new Error('missing in memory arguments');

  /** creating redis client */
  const redisClient = require('./redis-client').createClient({
    prefix,
    url,
  });

  return {
    hash: {
      set: async ({ key, data }) => {
        const keys = Object.keys(data);
        const args = [key];
        for (let i = 0; i < keys.length; i++) {
          args.push(keys[i], data[keys[i]]);
        }
        const result = await redisClient.hset(...args);
        return result;
      },
      delete: async ({ key, fields }) => {
        const args = [key];
        args.push(...fields);
        const result = await redisClient.hdel(...args);
        return result;
      },
      incrby: async ({ key, field, incr }) => {
        const result = await redisClient.hincrby(key, field, incr || 1);
        return result;
      },
      get: async ({ key }) => {
        const result = await redisClient.hgetall(key);
        return result;
      },
      setField: async ({ key, fieldKey, data }) => {
        const result = await redisClient.hset(key, fieldKey, data);
        return result;
      },
      getField: async ({ key, fieldKey }) => {
        const result = await redisClient.hget(key, fieldKey);
        return result;
      },
      getFields: async ({ key, fields }) => {
        const result = await redisClient.hmget(key, ...fields);
        if (result) {
          const obj = {};
          for (let i = 0; i < fields.length; i++) {
            obj[fields[i]] = result[i];
          }
          return obj;
        }
        return {};
      },
    },
    string: {
      expire: async ({ key, expire }) => {
        const result = await redisClient.expire(key, expire);
        return result;
      },
      exists: async ({ key }) => {
        const result = await redisClient.exists(key);
        return (result === 1);
      },
      delete: async ({ key }) => {
        keyCheck(key);
        let result = false;
        try {
          await redisClient.del(key);
          result = true;
          return result;
        } catch (err) {
          console.log(`failed to delete key ${key}`);
        }
        return result;
      },
      set: async ({ key, data, ttl }) => {
        keyCheck(key);
        let result = false;
        const args = [key, typeof data === 'string' ? data : JSON.stringify(data)];
        if (ttl) args.push('EX', ttl);
        try {
          await redisClient.set(...args);
          result = true;
        } catch (err) {
          console.log('failed to save to redis');
        }
        return result;
      },
      get: async ({ key }) => {
        keyCheck(key);
        let result = '';
        try {
          result = await redisClient.get(key);
          if (result) {
            try {
              return JSON.parse(result);
            } catch {
              return result;
            }
          }
        } catch (err) {
          console.log(`failed to get result for key ${key}`);
        }
        return result;
      },
    },
    set: {
      add: async ({ key, arr }) => {
        keyCheck(key);
        const result = await redisClient.sadd(key, ...arr);
        return result;
      },
      remove: async ({ key, arr }) => {
        keyCheck(key);
        const result = await redisClient.srem(key, ...arr);
        return result;
      },
      get: async ({ key }) => {
        const result = await redisClient.smembers(key);
        return result;
      },
      has: async ({ key, member }) => {
        const result = await redisClient.sismember(key, member);
        return result === 1;
      },
    },
    sorted: {
      get: async ({ sort, key, withScores = false, start, end }) => {
        keyCheck(key);
        let res = null;
        if (!start) start = 0;
        if (!end) end = 50;
        const min = start;
        const max = end;
        const args = ['ZRANGE'];
        args.push(key, min, max);
        if (!sort) sort = 'H2L';
        if (sort.toUpperCase() === 'H2L') {
          args.push('REV');
        }
        if (withScores) args.push('WITHSCORES');
        try {
          res = await redisClient.call(...args);
        } catch (err) {
          return { error: err.message || err };
        }
        if (withScores) {
          const obj = {};
          for (let i = 0; i < res.length; i += 2) {
            obj[res[i]] = res[i + 1];
          }
          return obj;
        }
        return res || [];
      },
      update: async ({ key, scores }) => {
        const args = [key].concat(scores);
        try {
          await redisClient.call('ZADD', ...args);
        } catch (err) {
          console.log(err);
        }
      },
      set: async ({ key, scores }) => {
        const args = [key].concat(scores);
        try {
          await redisClient.call('ZADD', ...args);
        } catch (err) {
          console.log(err);
        }
      },
      incrBy: async ({ key, field, score }) => {
        const args = [key, score, field];
        try {
          await redisClient.call('ZINCRBY', ...args);
        } catch (err) {
          console.log(err);
        }
      },
      remove: async ({ key, field }) => {
        const args = [key, field];
        try {
          await redisClient.call('ZREM', ...args);
        } catch (err) {
          console.log(err);
        }
      },
    },
  };
};
