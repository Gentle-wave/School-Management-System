# Quick Start Guide

## 🚀 How to Start the Application

### Prerequisites
Make sure you have installed:
- **Node.js** (v14 or higher)
- **MongoDB** (running locally or MongoDB Atlas connection string)
- **Redis** (running locally or Redis Cloud connection string)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Your `.env` file is already created. Make sure MongoDB and Redis are running, or update the connection strings:

```env
# If using MongoDB Atlas, update this:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# If using Redis Cloud, update this:
REDIS_URI=redis://username:password@host:port
```

### Step 3: Start MongoDB
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud) - no local setup needed
```

### Step 4: Start Redis
```bash
# macOS (Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Or use Redis Cloud (cloud) - no local setup needed
```

### Step 5: Start the Server

**Development Mode (with auto-reload and seeding):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## ✅ What Happens When You Start?

When you run `npm start` or `npm run dev`, here's what happens automatically:

1. **index.js runs automatically** - This is the entry point (defined in `package.json` as `"main": "index.js"`)

2. **Initialization Sequence:**
   ```
   ✅ Loads configuration from config/index.config.js
   ✅ Connects to Redis cache
   ✅ Connects to MongoDB
   ✅ Runs database seeding (development mode only)
   ✅ Initializes all managers (AuthManager, SchoolManager, etc.)
   ✅ Sets up Express app with all middleware
   ✅ Registers all API routes
   ✅ Starts HTTP server on port 3000
   ```

3. **All Routes Are Automatically Registered:**
   - `/api/auth/*` - Authentication endpoints
   - `/api/schools/*` - School management endpoints
   - `/api/classrooms/*` - Classroom management endpoints
   - `/api/students/*` - Student management endpoints
   - `/health` - Health check endpoint

## 📋 Complete Route List

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### School Routes (`/api/schools`)
- `POST /api/schools` - Create school (Superadmin only)
- `GET /api/schools` - List schools (with pagination)
- `GET /api/schools/:id` - Get school by ID
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school (soft delete)

### Classroom Routes (`/api/classrooms`)
- `POST /api/classrooms` - Create classroom
- `GET /api/classrooms` - List classrooms (with filters)
- `GET /api/classrooms/:id` - Get classroom by ID
- `PUT /api/classrooms/:id` - Update classroom
- `DELETE /api/classrooms/:id` - Delete classroom (soft delete)

### Student Routes (`/api/students`)
- `POST /api/students` - Create student
- `GET /api/students` - List students (with filters)
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student (soft delete)
- `POST /api/students/:id/transfer` - Transfer student to another classroom

## 🧪 Test the API

### 1. Check Health
```bash
curl http://localhost:3000/health
```

### 2. Login with Seeded Credentials (Development Mode)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@schoolsystem.com",
    "password": "SuperAdmin123!"
  }'
```

### 3. Use the Token
Copy the token from the response and use it in subsequent requests:
```bash
curl http://localhost:3000/api/schools \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Expected Console Output

When you start the server, you should see:

```
💾 Mongoose default connection open to mongodb://localhost:27017/school-management-system
✅ Redis client connected
✅ Redis client ready
✅ Cache Test Data: Redis Test Done.
🌱 Starting database seeding...
👤 Seeding users...
✅ Created 5 users
🏫 Seeding schools...
✅ Created 4 schools
📚 Seeding classrooms...
✅ Created 10 classrooms
🎓 Seeding students...
✅ Created 10 students
✅ Database seeding completed successfully!
🚀 Server running on port 3000
📝 Environment: development
💾 MongoDB: mongodb://localhost:27017/school-management-system
🔴 Redis: redis://127.0.0.1:6379
```

## 🔍 Troubleshooting

### MongoDB Connection Error
```
💾 Mongoose default connection error: ...
```
**Solution:** Make sure MongoDB is running:
```bash
brew services start mongodb-community  # macOS
# or
sudo systemctl start mongod  # Linux
```

### Redis Connection Error
```
❌ Redis connection error: ...
```
**Solution:** Make sure Redis is running:
```bash
brew services start redis  # macOS
# or
sudo systemctl start redis  # Linux
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Change the PORT in `.env` file or kill the process using port 3000:
```bash
lsof -ti:3000 | xargs kill -9
```

## ✨ Features Available on Start

- ✅ All routes are automatically registered
- ✅ Middleware is configured (auth, validation, rate limiting, error handling)
- ✅ Database seeding happens automatically (development only)
- ✅ Caching is enabled
- ✅ Security headers are set
- ✅ CORS is configured
- ✅ Request logging is enabled

## 🎯 Next Steps

1. Test the API using the seeded credentials
2. Explore the endpoints using Postman or curl
3. Check the README.md for detailed API documentation
4. Run tests: `npm test`
