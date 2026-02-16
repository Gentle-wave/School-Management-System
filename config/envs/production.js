module.exports = {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  logging: {
    level: 'info',
  },
};
