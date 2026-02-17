const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/index.config');
const ErrorHandlerMiddleware = require('./mws/errorHandler.middleware');
const RateLimitMiddleware = require('./mws/rateLimit.middleware');

class App {
  constructor({ managers }) {
    this.app = express();
    this.managers = managers;
    this._setupMiddleware();
    this._setupRoutes();
    this._setupErrorHandling();
  }

  _setupMiddleware() {

    this.app.use(helmet());
    this.app.use(cors(config.cors));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    if (config.dotEnv.ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    this.app.use('/api', RateLimitMiddleware.createLimiter());

    this.app.use(express.static('public'));

    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
      });
    });
  }

  _setupRoutes() {
    const AuthRoutes = require('./routes/auth.routes');
    const SchoolRoutes = require('./routes/school.routes');
    const ClassroomRoutes = require('./routes/classroom.routes');
    const StudentRoutes = require('./routes/student.routes');

    this.app.use('/api/auth', new AuthRoutes({ authManager: this.managers.authManager }).router);
    this.app.use('/api/schools', new SchoolRoutes({ schoolManager: this.managers.schoolManager }).router);
    this.app.use('/api/classrooms', new ClassroomRoutes({ classroomManager: this.managers.classroomManager }).router);
    this.app.use('/api/students', new StudentRoutes({ studentManager: this.managers.studentManager }).router);
  }

  _setupErrorHandling() {
    this.app.use(ErrorHandlerMiddleware.notFound);

    this.app.use(ErrorHandlerMiddleware.handle);
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;
