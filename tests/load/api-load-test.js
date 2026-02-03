import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let apiResponseTime = new Trend('api_response_time');

// Test data
const testUsers = [
  {
    organizationCode: 'HOSP-DEL-001',
    email: 'doctor1@hospital.com',
    password: 'password123'
  },
  {
    organizationCode: 'HOSP-DEL-002',
    email: 'doctor2@hospital.com',
    password: 'password123'
  },
  {
    organizationCode: 'BANK-DEL-001',
    email: 'admin1@bloodbank.com',
    password: 'password123'
  }
];

export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
    errors: ['rate<0.05'],
    api_response_time: ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // Test data setup
  console.log('Starting API load test...');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Test users: ${testUsers.length}`);
}

export default function () {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Test authentication
  let loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  let loginCheck = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
    'login contains token': (r) => r.json().token !== undefined,
  });
  
  errorRate.add(!loginCheck);
  apiResponseTime.add(loginResponse.timings.duration);
  
  if (loginResponse.status === 200 && loginResponse.json().token) {
    const token = loginResponse.json().token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // Test API endpoints
    const endpoints = [
      { method: 'GET', path: '/api/monitoring/health' },
      { method: 'GET', path: '/api/monitoring/metrics' },
      { method: 'GET', path: '/api/compliance/status' },
      { method: 'GET', path: '/api/blood-banks' },
      { method: 'GET', path: '/api/public-ngos' },
    ];
    
    endpoints.forEach(endpoint => {
      let response;
      
      if (endpoint.method === 'GET') {
        response = http.get(`${BASE_URL}${endpoint.path}`, { headers: authHeaders });
      }
      
      let endpointCheck = check(response, {
        [`${endpoint.path} status is 200`]: (r) => r.status === 200,
        [`${endpoint.path} response time < 2000ms`]: (r) => r.timings.duration < 2000,
        [`${endpoint.path} has valid response`]: (r) => r.body.length > 0,
      });
      
      errorRate.add(!endpointCheck);
      apiResponseTime.add(response.timings.duration);
    });
    
    // Test POST endpoint
    let bloodRequestResponse = http.post(`${BASE_URL}/api/hospital-blood-requests`, JSON.stringify({
      bloodGroup: 'A+',
      units: 2,
      urgency: 'medium',
      patientDetails: {
        name: 'Test Patient',
        age: 30,
        gender: 'male',
        bloodGroup: 'A+',
        reason: 'Test load'
      }
    }), { headers: authHeaders });
    
    let postCheck = check(bloodRequestResponse, {
      'blood request status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'blood request response time < 3000ms': (r) => r.timings.duration < 3000,
    });
    
    errorRate.add(!postCheck);
    apiResponseTime.add(bloodRequestResponse.timings.duration);
  }
  
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

export function teardown(data) {
  console.log('API load test completed');
  console.log('Final metrics will be available in the k6 output');
}
