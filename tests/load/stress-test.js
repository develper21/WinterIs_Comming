import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let stressResponseTime = new Trend('stress_response_time');
export let requestCounter = new Counter('requests');

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '3m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 300 },   // Ramp up to 300 users
    { duration: '5m', target: 400 },   // Ramp up to 400 users
    { duration: '3m', target: 500 },   // Ramp up to 500 users
    { duration: '2m', target: 600 },   // Peak load
    { duration: '5m', target: 600 },   // Sustain peak
    { duration: '3m', target: 400 },   // Ramp down
    { duration: '2m', target: 200 },   // Ramp down
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% under 5s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    errors: ['rate<0.1'],
    stress_response_time: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test scenarios
const scenarios = [
  { weight: 40, endpoint: '/health', method: 'GET', auth: false },
  { weight: 30, endpoint: '/api/monitoring/health', method: 'GET', auth: true },
  { weight: 20, endpoint: '/api/blood-banks', method: 'GET', auth: false },
  { weight: 10, endpoint: '/api/compliance/status', method: 'GET', auth: false },
];

export default function () {
  // Select scenario based on weights
  let random = Math.random() * 100;
  let cumulative = 0;
  let selectedScenario = scenarios[0];
  
  for (let scenario of scenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      selectedScenario = scenario;
      break;
    }
  }
  
  let response;
  let headers = {};
  
  // Add authentication if required
  if (selectedScenario.auth) {
    // Use a cached token or get a new one
    // For stress test, we'll use a simple token
    headers['Authorization'] = 'Bearer test-token';
    headers['Content-Type'] = 'application/json';
  }
  
  // Make request
  if (selectedScenario.method === 'GET') {
    response = http.get(`${BASE_URL}${selectedScenario.endpoint}`, { headers });
  } else if (selectedScenario.method === 'POST') {
    response = http.post(`${BASE_URL}${selectedScenario.endpoint}`, JSON.stringify({}), { headers });
  }
  
  // Check response
  let checkResult = check(response, {
    [`${selectedScenario.endpoint} status is 200`]: (r) => r.status === 200,
    [`${selectedScenario.endpoint} response time < 5000ms`]: (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!checkResult);
  stressResponseTime.add(response.timings.duration);
  requestCounter.add(1);
  
  // Random sleep to simulate real user behavior
  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  console.log('=== Stress Test Summary ===');
  console.log(`Total requests: ${data.metrics.requests.count}`);
  console.log(`Error rate: ${(data.metrics.errors.rate * 100).toFixed(2)}%`);
  console.log(`95th percentile response time: ${data.metrics.stress_response_time['p(95)']}ms`);
  console.log(`Average response time: ${data.metrics.http_req_duration.avg}ms`);
  
  if (data.metrics.errors.rate > 0.1) {
    console.log('⚠️  Error rate exceeded threshold!');
  }
  
  if (data.metrics.http_req_duration['p(95)'] > 5000) {
    console.log('⚠️  Response time exceeded threshold!');
  }
}
