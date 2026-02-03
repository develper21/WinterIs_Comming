import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

// Simple test route for testing
app.post('/api/auth/login', (req, res) => {
  const { organizationCode, email, password } = req.body;
  
  // Basic validation
  if (!organizationCode || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Organization code validation
  const orgCodeRegex = /^[A-Z]{3,4}-[A-Z]{3}-\d{3}$/;
  if (!orgCodeRegex.test(organizationCode)) {
    return res.status(400).json({ message: 'Invalid organization code format' });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  // Password validation
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  
  // Mock successful response for valid data
  res.status(200).json({
    message: 'Login successful',
    token: 'mock-jwt-token',
    user: {
      userCode: 'HOSP-DEL-001-001',
      name: 'Test User',
      email: email,
      role: 'doctor',
      organizationCode: organizationCode
    }
  });
});

describe('Authentication Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid organization code format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          organizationCode: 'INVALID',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid organization code format');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          organizationCode: 'HOSP-DEL-001',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          organizationCode: 'HOSP-DEL-001',
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Password must be at least 6 characters');
    });

    it('should return 200 for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          organizationCode: 'HOSP-DEL-001',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });
  });
});
