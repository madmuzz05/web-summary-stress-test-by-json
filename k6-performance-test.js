import http from "k6/http";
import { check, sleep } from "k6";

const apiName = "your-api-name";
const environment = "your-environment";
const baseUrl = "your-base-url";
const token = "your-token";
const api_url = baseUrl + "your-api-endpoint";
const method = "POST"; // POST atau GET
const maxResponseTime = 500;
const maxErrorRate = 0.1;

// Request payload
const payload = JSON.stringify({});

// Konfigurasi test scenarios
export const options = {
  stages: [
    { duration: "10s", target: 10 }, // Ramp up to 50 VUs over 10 seconds
    { duration: "50s", target: 50 }, // Ramp up to 100 VUs over 50 seconds
    { duration: "10s", target: 0 }, // Ramp up to 100 VUs over 50 seconds
  ],
  thresholds: {
    http_req_duration: ["p(95)<" + maxResponseTime], // 95% of requests must be below 2000ms
    http_req_failed: ["rate<" + maxErrorRate], // Error rate must be below 10%
  },
};
// Base URL dan headers
const headers = {
  accept: "application/json",
  Authorization: token ? "Bearer " + token : "",
  "Content-Type": "application/json",
};

export default function () {
  let response;
  if (method == "POST") {
    response = http.post(api_url, payload, {
      headers: headers,
    });
  } else {
    response = http.get(api_url, payload, {
      headers: headers,
    });
  }

  // Validasi response
const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500, // bisa diganti
    "response has body": (r) => r.body && r.body.length > 0,
    "content type is JSON": (r) =>
      r.headers["Content-Type"] &&
      r.headers["Content-Type"].includes("application/json"),
  });
  
  if (!success) {
    console.log(`❌ One or more checks failed. Status: ${response.status}, Time: ${response.timings.duration}ms`)
  }

  // Simulasi think time antara request (opsional)
  sleep(1);
}


// Teardown function (dijalankan sekali di akhir)
export function teardown(data) {
  console.log("Performance test completed!");
}

// Generate custom reports
export function handleSummary(data) {
  data.api_name = apiName;
  data.environment = environment;
  data.api_url = api_url;
  data.method = method;
  data.payload = JSON.parse(payload);
  return {
    [`performance-results_${apiName}_${new Date().toISOString()}.json`]: JSON.stringify(data, null, 2),
  };
}
