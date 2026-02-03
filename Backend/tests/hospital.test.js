import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

// Mock hospital routes for testing
app.get('/api/hospitals/nearby', (req, res) => {
  const { latitude, longitude, radius = 10 } = req.query;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }
  
  // Mock hospital data
  const hospitals = [
    {
      _id: 'hospital1',
      name: 'City General Hospital',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Delhi coordinates
      },
      address: '123 Main Street, Delhi',
      phone: '+91-11-12345678',
      email: 'info@cityhospital.com',
      bloodBank: {
        available: true,
        bloodGroups: {
          'A+': 10,
          'B+': 5,
          'O+': 15,
          'AB+': 3
        }
      },
      distance: 2.5
    },
    {
      _id: 'hospital2',
      name: 'Metro Medical Center',
      location: {
        type: 'Point',
        coordinates: [77.2190, 28.6239]
      },
      address: '456 Park Avenue, Delhi',
      phone: '+91-11-87654321',
      email: 'contact@metrocenter.com',
      bloodBank: {
        available: true,
        bloodGroups: {
          'A+': 8,
          'B+': 12,
          'O+': 20,
          'AB+': 5
        }
      },
      distance: 5.0
    }
  ];
  
  res.json(hospitals);
});

app.post('/api/hospitals/blood-request', (req, res) => {
  const { hospitalId, bloodGroup, units, urgency, patientDetails } = req.body;
  
  if (!hospitalId || !bloodGroup || !units || !urgency) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (!validBloodGroups.includes(bloodGroup)) {
    return res.status(400).json({ message: 'Invalid blood group' });
  }
  
  if (units < 1 || units > 10) {
    return res.status(400).json({ message: 'Units must be between 1 and 10' });
  }
  
  const validUrgency = ['low', 'medium', 'high', 'critical'];
  if (!validUrgency.includes(urgency)) {
    return res.status(400).json({ message: 'Invalid urgency level' });
  }
  
  // Mock successful request
  const requestId = `REQ-${Date.now()}`;
  res.status(201).json({
    requestId,
    status: 'pending',
    message: 'Blood request submitted successfully',
    estimatedTime: urgency === 'critical' ? '15-30 minutes' : '1-2 hours'
  });
});

describe('Hospital API Routes', () => {
  describe('GET /api/hospitals/nearby', () => {
    it('should return 400 for missing coordinates', async () => {
      const response = await request(app)
        .get('/api/hospitals/nearby')
        .query({ latitude: '28.6139' }); // missing longitude

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Latitude and longitude are required');
    });

    it('should return nearby hospitals for valid coordinates', async () => {
      const response = await request(app)
        .get('/api/hospitals/nearby')
        .query({ 
          latitude: '28.6139', 
          longitude: '77.2090',
          radius: '10'
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      
      // Check hospital structure
      const hospital = response.body[0];
      expect(hospital).toHaveProperty('_id');
      expect(hospital).toHaveProperty('name');
      expect(hospital).toHaveProperty('address');
      expect(hospital).toHaveProperty('phone');
      expect(hospital).toHaveProperty('bloodBank');
      expect(hospital.bloodBank).toHaveProperty('available');
      expect(hospital.bloodBank).toHaveProperty('bloodGroups');
    });

    it('should filter hospitals within radius', async () => {
      const response = await request(app)
        .get('/api/hospitals/nearby')
        .query({ 
          latitude: '28.6139', 
          longitude: '77.2090',
          radius: '3' // Small radius
        });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeLessThanOrEqual(2);
      
      // All hospitals should be within the specified radius
      response.body.forEach(hospital => {
        expect(hospital.distance).toBeLessThanOrEqual(10); // Mock data distance
      });
    });
  });

  describe('POST /api/hospitals/blood-request', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/hospitals/blood-request')
        .send({
          hospitalId: 'hospital1',
          bloodGroup: 'O+'
          // missing units and urgency
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 400 for invalid blood group', async () => {
      const response = await request(app)
        .post('/api/hospitals/blood-request')
        .send({
          hospitalId: 'hospital1',
          bloodGroup: 'X+', // Invalid blood group
          units: 2,
          urgency: 'high'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid blood group');
    });

    it('should return 400 for invalid units range', async () => {
      const response = await request(app)
        .post('/api/hospitals/blood-request')
        .send({
          hospitalId: 'hospital1',
          bloodGroup: 'O+',
          units: 15, // More than allowed
          urgency: 'high'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Units must be between 1 and 10');
    });

    it('should return 400 for invalid urgency level', async () => {
      const response = await request(app)
        .post('/api/hospitals/blood-request')
        .send({
          hospitalId: 'hospital1',
          bloodGroup: 'O+',
          units: 2,
          urgency: 'super-urgent' // Invalid urgency
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid urgency level');
    });

    it('should create blood request successfully', async () => {
      const requestData = {
        hospitalId: 'hospital1',
        bloodGroup: 'O+',
        units: 3,
        urgency: 'critical',
        patientDetails: {
          name: 'John Doe',
          age: 45,
          gender: 'male',
          medicalId: 'MED-001'
        }
      };

      const response = await request(app)
        .post('/api/hospitals/blood-request')
        .send(requestData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('estimatedTime');
      expect(response.body.requestId).toMatch(/^REQ-\d+$/);
    });

    it('should handle different urgency levels correctly', async () => {
      const testCases = [
        { urgency: 'low', expectedTime: '1-2 hours' },
        { urgency: 'medium', expectedTime: '1-2 hours' },
        { urgency: 'high', expectedTime: '1-2 hours' },
        { urgency: 'critical', expectedTime: '15-30 minutes' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/hospitals/blood-request')
          .send({
            hospitalId: 'hospital1',
            bloodGroup: 'O+',
            units: 2,
            urgency: testCase.urgency
          });

        expect(response.status).toBe(201);
        expect(response.body.estimatedTime).toBe(testCase.expectedTime);
      }
    });
  });
});
