const AuthManager = require('../managers/AuthManager');
const SchoolManager = require('../managers/SchoolManager');
const ClassroomManager = require('../managers/ClassroomManager');
const StudentManager = require('../managers/StudentManager');

class ManagersLoader {
  constructor({ config, cache }) {
    this.config = config;
    this.cache = cache;
  }

  load() {
    return {
      authManager: new AuthManager({ cache: this.cache }),
      schoolManager: new SchoolManager({ cache: this.cache }),
      classroomManager: new ClassroomManager({ cache: this.cache }),
      studentManager: new StudentManager({ cache: this.cache }),
    };
  }
}

module.exports = ManagersLoader;
