# SEBN Backend - MongoDB Edition

Smart Emergency Blood Network Backend with MongoDB native driver.

## 📁 Project Structure

```
Backend/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   ├── AuthController.js        # Authentication logic
│   └── NgoController.js         # NGO operations
├── middleware/
│   ├── auth.middleware.js       # JWT verification
│   └── role.middleware.js       # Role-based access
├── models/
│   └── User.js                  # User model
├── routes/
│   ├── AuthRoutes.js            # Auth endpoints
│   └── NgoRoutes.js             # NGO endpoints
├── utils/
│   ├── constants.js             # App constants
│   ├── responseHandler.js       # Response utilities
│   └── validators.js            # Input validation
├── app.js                       # Express app setup
├── server.js                    # Server entry point
├── package.json
├── .env                         # Your configuration
└── .env.example                 # Config template
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.x
- MongoDB >= 5.0
- npm or yarn

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Create .env file**
```bash
cp .env.example .env
```

3. **Configure MongoDB**
Edit `.env` with your MongoDB connection:
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=sebn_db
JWT_SECRET=your_secret_key
```

### Running the Server

**Development (with auto-reload)**
```bash
npm run dev
```

**Production**
```bash
npm start
```

Server will run on `http://localhost:5000`

## 📚 API Endpoints

### Public Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /health` - Health check

### Protected Routes
- `GET /api/ngo/*` - NGO endpoints (requires auth)

## 🔐 Authentication

### Register
```bash
POST /api/auth/register
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "role": "user|hospital|bloodbank|ngo|admin"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token",
  "user": {...}
}
```

### Using Token
```bash
Authorization: Bearer <token>
```

## 📊 Database Collections

### users
- `_id` - ObjectId
- `name` - String
- `email` - String (unique)
- `password` - String (hashed)
- `role` - String (user, admin, hospital, bloodbank, ngo)
- `organizationName` - String (optional)
- `registrationNumber` - String (optional)
- `createdAt` - Date
- `updatedAt` - Date

## 🔧 Configuration

Edit `.env` file to configure:

| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | development | Environment |
| PORT | 5000 | Server port |
| MONGODB_URI | mongodb://localhost:27017 | MongoDB URI |
| DB_NAME | sebn_db | Database name |
| JWT_SECRET | your_jwt_secret | JWT secret key |
| CORS_ORIGIN | * | CORS allowed origins |

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## 📝 File Descriptions

### config/db.js
MongoDB connection using native driver with connection pooling and index creation.

### models/User.js
User data model with methods:
- `create()` - Create new user
- `findByEmail()` - Find user by email
- `findById()` - Find user by ID
- `updateById()` - Update user
- `deleteById()` - Delete user
- `findAll()` - Find multiple users
- `findByRole()` - Find users by role

### controllers/AuthController.js
Authentication logic:
- `register()` - User registration
- `login()` - User login

### middleware/auth.middleware.js
JWT token verification middleware.

### middleware/role.middleware.js
Role-based access control middleware.

### utils/
- `constants.js` - Application constants
- `validators.js` - Input validation functions
- `responseHandler.js` - Response formatting helpers

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Ensure MongoDB is running: `mongod` |
| Port already in use | Change PORT in .env or kill process on port 5000 |
| JWT token invalid | Check JWT_SECRET in .env matches signing key |
| CORS errors | Verify CORS_ORIGIN in .env includes your frontend URL |

## 📦 Dependencies

- **express** - Web framework
- **mongodb** - MongoDB driver
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - CORS middleware
- **dotenv** - Environment configuration

## 🚀 Production Checklist

- [ ] MongoDB connected and verified
- [ ] JWT_SECRET changed to secure value
- [ ] CORS_ORIGIN configured correctly
- [ ] Environment set to production
- [ ] Error handling tested
- [ ] Authentication tested
- [ ] Database backups enabled
- [ ] Logs configured
- [ ] HTTPS enabled

## 📞 Support

For issues:
1. Check error messages in terminal
2. Verify MongoDB is running
3. Check .env configuration
4. Review API response messages

## 📄 License

All rights reserved. SEBN Project 2025
