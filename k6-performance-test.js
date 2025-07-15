import http from "k6/http";
import { check, fail, sleep } from "k6";

const apiName = "get-event-room";
const environment = "local";
const baseUrl = "http://pismart-api-bit:8888/";
const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxNzUzIiwianRpIjoiOTcwZmJiNmMwZjA5YmQxNDYzMTA1NGMxNzU2N2I4ZmZhZWIzN2E2YjcxNDI0ZWQ1MDhhZjY1YjEwZThmMzBjM2FhNjQ1NTdkN2MyN2E2ZmYiLCJpYXQiOjE3MjE4MDMzNzEuNzc4MDg4LCJuYmYiOjE3MjE4MDMzNzEuNzc4MDg5LCJleHAiOjE3NTMzMzkzNzEuNzY3OTIxLCJzdWIiOiIxOTc0Iiwic2NvcGVzIjpbXX0.cX4dMD9RVRVY1XraKHnhEVJjajeR1msdyOKBxz5NeYQEI0DQVoJSK_dd5fYKuhISDtr9vqKaNNxzfrPZfW2CjEDNrL3wqQhNPTf-CNBKsveA760NiytleF9GdnLlwC6awjXWxIiZPWn7fUeNqJj0q5eCin72Ps6JmP3ZEgh2uAkMwGxyBYEAdVpOuXtU-2zFfWKZD3SuPE78LxIX02DnWhpfzd2EwsPAEUVE2btFBx_H6kSOE172evi6pctyEfLBrSSmBEJYExxb1cMdm3z-p7MLr3x21ddx6Sv25w_J3CcdRmzbKe5Vj3P0oznwIcFpNMK_z2ciR6hV3XM-s2haNSfakUpUJl82Y6kuEgslLEC5hW3u2GoQ3Gr7FjAGuXw9TZIJHvxNhQ6-7cNnviE74ygcH8UW5PYArNBTP-c0ZiJ8q60wNRtCrUewEi0SjDnu-F7Pd-kAkVXEDSj4HI2E43aX6VdcU9Ej-dh3Qw1ISlO0NDkqqOCbIZncRPHrNpy2ywkpD0-XfFNixicbdskJJiY408S1QIzeKxg105wOlYI2iKZTWLrTmGJZg2SGc1fmw-91zO6AM89S2DtiedMUcLNEuEFZnETakTajTB_IAGRRs9nGzsDjwOcRcY5fzFt-mVsFr5C2I_cAiUOAgSaD23VbxxHWzddnNu7w-bJHorY";
const api_url = baseUrl + "api/web/v1/event/rooms";
const method = "GET"; // POST atau GET
const maxResponseTime = 500;
const maxErrorRate = 0.1;

// Request payload
const payload = JSON.stringify({filter: "A000"});

// Konfigurasi test scenarios
export const options = {
  stages: [
    { duration: "10s", target: 5 }, // Ramp up to 50 VUs over 10 seconds
    { duration: "50s", target: 10 }, // Ramp up to 100 VUs over 50 seconds
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
    "status is 200": (r) => r.status == 200,
    "status >= 400 and status < 500": (r) => r.status >= 400 && r.status < 500,
    "status >= 500": (r) => r.status >= 500,
    "response time < 200ms": (r) => r.timings.duration < 200, // bisa diganti
    "response time < 500ms": (r) => r.timings.duration < 500, // bisa diganti
    "response time < 1000ms": (r) => r.timings.duration < 1000, // bisa diganti
  });
  
  if (response.status >= 400 || response.timings.duration > maxResponseTime) {
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
