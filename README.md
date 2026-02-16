# School Management System API

A comprehensive RESTful API for managing schools, classrooms, and students with role-based access control (RBAC), built with Express.js, MongoDB, and Redis.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Deployment](#deployment)
- [Assumptions](#assumptions)

## Features

- ✅ **Role-Based Access Control (RBAC)**
  - Superadmin: Full system access
  - School Administrator: School-specific access

- ✅ **Comprehensive CRUD Operations**
  - Schools management
  - Classrooms management
  - Students management

- ✅ **Security Features**
  - JWT-based authentication
  - Password hashing with bcrypt
  - API rate limiting
  - Input validation and sanitization
  - Helmet.js security headers

- ✅ **Performance**
  - Redis caching layer
  - Optimized database queries
  - Efficient pagination

- ✅ **Professional Code Structure**
  - Class-based architecture
  - Separation of concerns
  - Reusable middleware
  - Error handling

- ✅ **Development Features**
  - Automatic database seeding (development mode)
  - Comprehensive test suite
  - Code coverage reporting

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis (ioredis)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Security**: Helmet, bcrypt
- **Rate Limiting**: express-rate-limit
- **Testing**: Jest, Supertest

## Project Structure

```
School Management System/
├── cache/                 # Redis cache utilities
│   ├── cache.dbh.js      # Cache database helper
│   └── redis-client.js   # Redis client setup
├── config/                # Configuration files
│   ├── index.config.js   # Main configuration
│   └── envs/             # Environment-specific configs
│       ├── development.js
│       ├── production.js
│       └── test.js
├── connect/              # Database connections
│   └── mongo.js         # MongoDB connection
├── libs/                 # Utility libraries
│   ├── constants.js     # Application constants
│   ├── errors.js        # Custom error classes
│   └── utils.js         # Helper functions
├── loaders/              # Loader classes
│   ├── ManagersLoader.js
│   └── SeedLoader.js    # Database seeding
├── tests/                # Test files
│   ├── unit/            # Unit tests
│   │   ├── managers/
│   │   └── middleware/
│   ├── integration/      # Integration tests
│   └── setup.js         # Test configuration
├── managers/             # Business logic managers
│   ├── AuthManager.js
│   ├── SchoolManager.js
│   ├── ClassroomManager.js
│   └── StudentManager.js
├── models/               # Mongoose models
│   ├── User.js
│   ├── School.js
│   ├── Classroom.js
│   └── Student.js
├── mws/                  # Middleware
│   ├── auth.middleware.js
│   ├── authorization.middleware.js
│   ├── errorHandler.middleware.js
│   ├── rateLimit.middleware.js
│   └── validation.middleware.js
├── routes/               # API routes
│   ├── auth.routes.js
│   ├── school.routes.js
│   ├── classroom.routes.js
│   └── student.routes.js
├── app.js                # Express app setup
├── index.js              # Application entry point
├── package.json
├── .env.example
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "School Management System"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

4. **Start MongoDB**
   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Or use MongoDB Atlas (cloud)
   ```

5. **Start Redis**
   ```bash
   # macOS (using Homebrew)
   brew services start redis

   # Linux
   sudo systemctl start redis

   # Or use Redis Cloud
   ```

6. **Start the server**
   ```bash
   # Development mode (includes automatic seeding)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000` (or your configured PORT).

**Note**: In development mode, the database will be automatically seeded with test data on first startup. This only happens once unless you clear the seed flags.

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SERVICE_NAME=school-management-system
ENV=development
PORT=3000

MONGO_URI=mongodb://localhost:27017/school-management-system
REDIS_URI=redis://127.0.0.1:6379
CACHE_REDIS=redis://127.0.0.1:6379
CACHE_PREFIX=school-management-system:ch

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Schema

### User Model
- `email` (String, unique, required)
- `password` (String, hashed, required)
- `role` (Enum: 'superadmin', 'school_administrator', required)
- `schoolId` (ObjectId, ref: School, nullable)
- `isActive` (Boolean, default: true)
- `lastLogin` (Date)

### School Model
- `name` (String, required)
- `address` (Object: street, city, state, zipCode, country)
- `contact` (Object: phone, email)
- `isActive` (Boolean, default: true)
- `metadata` (Map)

### Classroom Model
- `name` (String, required)
- `schoolId` (ObjectId, ref: School, required)
- `capacity` (Number, required, min: 1, max: 1000)
- `currentEnrollment` (Number, default: 0)
- `gradeLevel` (String)
- `resources` (Map)
- `isActive` (Boolean, default: true)

### Student Model
- `firstName` (String, required)
- `lastName` (String, required)
- `dateOfBirth` (Date, required)
- `studentId` (String, unique, auto-generated)
- `schoolId` (ObjectId, ref: School, required)
- `classroomId` (ObjectId, ref: Classroom, nullable)
- `enrollmentDate` (Date, default: now)
- `contact` (Object: email, phone, guardianName, guardianPhone)
- `address` (Object: street, city, state, zipCode)
- `isActive` (Boolean, default: true)
- `metadata` (Map)

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "role": "superadmin",
  "schoolId": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "admin@example.com",
    "role": "superadmin",
    "isActive": true
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "admin@example.com",
      "role": "superadmin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```

### School Endpoints

#### Create School (Superadmin only)
```http
POST /api/schools
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Lincoln High School",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "country": "USA"
  },
  "contact": {
    "phone": "555-1234",
    "email": "info@lincoln.edu"
  }
}
```

#### List Schools
```http
GET /api/schools?page=1&limit=10&search=lincoln&isActive=true
Authorization: Bearer <token>
```

#### Get School by ID
```http
GET /api/schools/:id
Authorization: Bearer <token>
```

#### Update School
```http
PUT /api/schools/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Lincoln High School Updated",
  "isActive": true
}
```

#### Delete School
```http
DELETE /api/schools/:id
Authorization: Bearer <token>
```

### Classroom Endpoints

#### Create Classroom
```http
POST /api/classrooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Math 101",
  "schoolId": "...",
  "capacity": 30,
  "gradeLevel": "9"
}
```

#### List Classrooms
```http
GET /api/classrooms?schoolId=...&page=1&limit=10
Authorization: Bearer <token>
```

#### Get Classroom by ID
```http
GET /api/classrooms/:id
Authorization: Bearer <token>
```

#### Update Classroom
```http
PUT /api/classrooms/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "capacity": 35,
  "gradeLevel": "10"
}
```

#### Delete Classroom
```http
DELETE /api/classrooms/:id
Authorization: Bearer <token>
```

### Student Endpoints

#### Create Student
```http
POST /api/students
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2010-05-15",
  "schoolId": "...",
  "classroomId": "...",
  "contact": {
    "email": "john.doe@example.com",
    "phone": "555-5678",
    "guardianName": "Jane Doe",
    "guardianPhone": "555-5679"
  }
}
```

#### List Students
```http
GET /api/students?schoolId=...&classroomId=...&page=1&limit=10&search=john
Authorization: Bearer <token>
```

#### Get Student by ID
```http
GET /api/students/:id
Authorization: Bearer <token>
```

#### Update Student
```http
PUT /api/students/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Johnny",
  "classroomId": "..."
}
```

#### Delete Student
```http
DELETE /api/students/:id
Authorization: Bearer <token>
```

#### Transfer Student
```http
POST /api/students/:id/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "classroomId": "..."
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained through the `/api/auth/login` endpoint and expire after 7 days (configurable).

## Authorization

### Roles

1. **Superadmin**
   - Full access to all schools, classrooms, and students
   - Can create, read, update, and delete any resource

2. **School Administrator**
   - Limited to their assigned school
   - Can manage classrooms and students within their school
   - Cannot access other schools' resources

### Permissions

- `schools:create` - Create schools (Superadmin only)
- `schools:read` - View schools
- `schools:update` - Update schools
- `schools:delete` - Delete schools
- `schools:list` - List schools
- `classrooms:create` - Create classrooms
- `classrooms:read` - View classrooms
- `classrooms:update` - Update classrooms
- `classrooms:delete` - Delete classrooms
- `classrooms:list` - List classrooms
- `students:create` - Create students
- `students:read` - View students
- `students:update` - Update students
- `students:delete` - Delete students
- `students:list` - List students
- `students:transfer` - Transfer students between classrooms

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "errors": [] // Optional: validation errors
  }
}
```

### Error Codes

- `VALIDATION_ERROR` (400) - Input validation failed
- `AUTHENTICATION_ERROR` (401) - Authentication failed
- `AUTHORIZATION_ERROR` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT_ERROR` (409) - Resource conflict (e.g., duplicate)
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_SERVER_ERROR` (500) - Server error

## Database Seeding

The application includes an automatic database seeding system that runs **only in development mode** when the server starts. This ensures you have test data ready without manual setup.

### Features

- ✅ **Automatic Execution**: Seeds run automatically on server start in development mode
- ✅ **Idempotent**: Prevents duplicate seeding using cache and database flags
- ✅ **Comprehensive Data**: Includes all test cases and scenarios
- ✅ **Production Safe**: Never runs in production environment

### Seed Data Includes

1. **Users** (5 users):
   - 1 Superadmin user
   - 3 School Administrators (one for each school)
   - 1 Inactive user (for testing)

2. **Schools** (4 schools):
   - 3 Active schools (Lincoln High School, Washington Elementary, Roosevelt Middle School)
   - 1 Inactive school (for testing)

3. **Classrooms** (10+ classrooms):
   - Multiple classrooms per school
   - Various grade levels
   - Different capacities and resources
   - One full-capacity classroom
   - One inactive classroom

4. **Students** (10+ students):
   - Students across all schools
   - Various enrollment statuses
   - Students with and without classroom assignments
   - Inactive students for testing

### Test Credentials

After seeding, you can use these credentials for testing:

**Superadmin:**
- Email: `superadmin@schoolsystem.com`
- Password: `SuperAdmin123!`

**School Administrators:**
- Email: `admin@lincoln.edu` (Lincoln High School)
- Password: `Admin123!`

- Email: `admin@washington.edu` (Washington Elementary School)
- Password: `Admin123!`

- Email: `admin@roosevelt.edu` (Roosevelt Middle School)
- Password: `Admin123!`

### How It Works

1. On server start in development mode, the seed loader checks if seeds have already been executed
2. If not executed, it clears existing data and populates the database
3. A flag is set in both Redis cache and MongoDB to prevent duplicate runs
4. Seeds will not run again unless the database is cleared manually

### Manual Seed Control

To reset and re-seed the database:

```javascript
// In development mode, you can manually trigger seeding by:
// 1. Clearing the seed flag in Redis: DEL school-management-system:ch:seeds:executed
// 2. Or deleting the seed_flags collection in MongoDB
// 3. Restart the server
```

## Testing

### Automated Testing

The project includes a comprehensive test suite using Jest and Supertest.

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

#### Test Coverage

The test suite includes:

- **Unit Tests** (`tests/unit/`):
  - Manager classes (AuthManager, SchoolManager, etc.)
  - Middleware (authentication, authorization, validation)
  - Error handling

- **Integration Tests** (`tests/integration/`):
  - API endpoint testing
  - Authentication flow
  - CRUD operations

#### Test Structure

```
tests/
├── unit/
│   ├── managers/
│   │   ├── AuthManager.test.js
│   │   └── SchoolManager.test.js
│   └── middleware/
│       ├── auth.middleware.test.js
│       └── authorization.middleware.test.js
├── integration/
│   └── auth.integration.test.js
└── setup.js
```

#### Writing Tests

Example test structure:

```javascript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', async () => {
    // Test implementation
  });
});
```

### Manual Testing with cURL

1. **Register a superadmin:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "role": "superadmin"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

3. **Create a school:**
```bash
curl -X POST http://localhost:3000/api/schools \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Test School",
    "address": {
      "city": "Test City"
    }
  }'
```

### Using Postman

Import the following collection structure:
- Authentication (Register, Login, Profile)
- Schools (CRUD operations)
- Classrooms (CRUD operations)
- Students (CRUD + Transfer)

**Note**: In development mode, you can use the seeded test credentials above for quick testing.

## Deployment

### Environment Setup

1. **Set production environment variables:**
   ```env
   ENV=production
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
   REDIS_URI=redis://your-redis-host:6379
   JWT_SECRET=<strong-random-secret>
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Build considerations:**
   - Ensure MongoDB and Redis are accessible
   - Set up proper firewall rules
   - Use environment-specific configurations
   - Enable HTTPS in production

### Deployment Platforms

#### Heroku
```bash
heroku create school-management-api
heroku config:set ENV=production
heroku config:set MONGO_URI=...
heroku config:set REDIS_URI=...
heroku config:set JWT_SECRET=...
git push heroku main
```

#### AWS/DigitalOcean
- Use PM2 or systemd for process management
- Set up Nginx reverse proxy
- Configure SSL certificates
- Set up MongoDB Atlas and Redis Cloud

### Health Check

The API includes a health check endpoint:
```http
GET /health
```

## Assumptions

1. **Soft Deletes**: Resources are marked as `isActive: false` rather than being permanently deleted
2. **Student ID Generation**: Auto-generated based on school name, year, and sequential number
3. **Classroom Capacity**: Enforced at enrollment time; cannot reduce capacity below current enrollment
4. **School Assignment**: School administrators must be assigned to a school during registration
5. **Transfer Logic**: Students can be transferred between classrooms within the same school
6. **Enrollment Tracking**: Classroom enrollment is automatically updated when students are added/removed/transferred
7. **Caching Strategy**: Frequently accessed resources are cached for 5-30 minutes
8. **Pagination**: Default page size is 10, maximum is 100

## Additional Notes

- The codebase follows ES6+ JavaScript standards
- Uses class-based architecture for better organization
- Implements comprehensive input validation
- Includes rate limiting to prevent abuse
- Uses switch statements instead of if-else chains where appropriate
- Minimizes code repetition through reusable middleware and managers
- Follows RESTful API best practices

## License

ISC

## Author

Adebayo oluwatobiloba
