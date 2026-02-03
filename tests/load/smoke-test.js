import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 },  // Stay at 10 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
    errors: ['rate<0.1'],             // Custom error rate under 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test health endpoint
  let healthResponse = http.get(`${BASE_URL}/health`);
  
  let healthCheck = check(healthResponse, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
    'health response contains status': (r) => r.json().status === 'OK',
  });
  
  errorRate.add(!healthCheck);
  
  // Test API endpoints
  let endpoints = [
    '/api/monitoring/health',
    '/api/compliance/status',
  ];
  
  endpoints.forEach(endpoint => {
    let response = http.get(`${BASE_URL}${endpoint}`);
    
    let checkResult = check(response, {
      [`${endpoint} status is 200`]: (r) => r.status === 200,
      [`${endpoint} response time < 1000ms`]: (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(!checkResult);
  });
  
  sleep(1);
}
