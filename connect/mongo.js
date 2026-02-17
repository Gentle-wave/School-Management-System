const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

module.exports = ({ uri }) => {
  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongoose.connection.on('connected', function () {
    console.log('💾 Mongoose default connection open to ' + uri);
  });

  mongoose.connection.on('error', function (err) {
    console.log('💾 Mongoose default connection error: ' + err);
    console.log('=> if using local mongodb: make sure that mongo server is running \n' +
      '=> if using online mongodb: check your internet connection \n');
  });

  mongoose.connection.on('disconnected', function () {
    console.log('💾 Mongoose default connection disconnected');
  });

  process.on('SIGINT', function () {
    mongoose.connection.close(function () {
      console.log('💾 Mongoose default connection disconnected through app termination');
      process.exit(0);
    });
  });

  return mongoose.connection;
};
