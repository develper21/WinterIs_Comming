import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let soakResponseTime = new Trend('soak_response_time');

export const options = {
  stages: [
    { duration: '10m', target: 10 },   // Ramp up to 10 users
    { duration: '1h', target: 10 },    // Stay at 10 users for 1 hour
    { duration: '10m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% under 1s
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
    errors: ['rate<0.01'],
    soak_response_time: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test health endpoint
  let response = http.get(`${BASE_URL}/health`);
  
  let checkResult = check(response, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!checkResult);
  soakResponseTime.add(response.timings.duration);
  
  // Test API endpoint
  let apiResponse = http.get(`${BASE_URL}/api/monitoring/health`);
  
  let apiCheck = check(apiResponse, {
    'api health status is 200': (r) => r.status === 200,
    'api health response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!apiCheck);
  soakResponseTime.add(apiResponse.timings.duration);
  
  sleep(30); // Wait 30 seconds between requests
}
