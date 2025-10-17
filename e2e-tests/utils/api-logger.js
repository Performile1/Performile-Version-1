// API Logger Utility - October 17, 2025
// Intercepts, records, and validates API calls during tests

const fs = require('fs').promises;

class APILogger {
  constructor(page) {
    this.page = page;
    this.apiCalls = [];
    this.callCounter = 0;
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Intercept all API requests
    this.page.route('**/api/**', async (route) => {
      const request = route.request();
      const callId = `api-${++this.callCounter}`;
      const startTime = Date.now();

      // Record request
      const apiCall = {
        id: callId,
        endpoint: this.extractEndpoint(request.url()),
        method: request.method(),
        requestHeaders: request.headers(),
        requestBody: this.parseBody(request.postData()),
        timestamp: new Date()
      };

      try {
        // Continue with the request
        const response = await route.fetch();
        const endTime = Date.now();

        // Record response
        apiCall.responseStatus = response.status();
        apiCall.responseHeaders = response.headers();
        apiCall.responseBody = await this.parseResponse(response);
        apiCall.duration = endTime - startTime;

        // Fulfill the route with the response
        await route.fulfill({ response });
      } catch (error) {
        apiCall.error = error.message;
        await route.abort();
      }

      this.apiCalls.push(apiCall);
    });
  }

  extractEndpoint(url) {
    const match = url.match(/\/api\/(.+?)(?:\?|$)/);
    return match ? `/api/${match[1]}` : url;
  }

  parseBody(body) {
    if (!body) return null;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  async parseResponse(response) {
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  // Get all API calls
  getAPICalls() {
    return this.apiCalls;
  }

  // Get calls by endpoint
  getCallsByEndpoint(endpoint) {
    return this.apiCalls.filter(call => call.endpoint.includes(endpoint));
  }

  // Get calls by method
  getCallsByMethod(method) {
    return this.apiCalls.filter(call => call.method === method);
  }

  // Get failed calls (4xx, 5xx)
  getFailedCalls() {
    return this.apiCalls.filter(call => 
      call.responseStatus && call.responseStatus >= 400
    );
  }

  // Get slow calls (>1s)
  getSlowCalls(threshold = 1000) {
    return this.apiCalls.filter(call => 
      call.duration && call.duration > threshold
    );
  }

  // Validate specific API call
  validateCall(endpoint, expectedStatus) {
    const call = this.apiCalls.find(c => c.endpoint.includes(endpoint));
    return call?.responseStatus === expectedStatus;
  }

  // Get average response time
  getAverageResponseTime() {
    const callsWithDuration = this.apiCalls.filter(c => c.duration);
    if (callsWithDuration.length === 0) return 0;
    
    const total = callsWithDuration.reduce((sum, c) => sum + (c.duration || 0), 0);
    return total / callsWithDuration.length;
  }

  // Clear logs
  clear() {
    this.apiCalls = [];
    this.callCounter = 0;
  }

  // Print summary
  printSummary() {
    console.log('\n=== API Calls Summary ===');
    console.log(`Total API calls: ${this.apiCalls.length}`);
    console.log(`Failed calls: ${this.getFailedCalls().length}`);
    console.log(`Slow calls (>1s): ${this.getSlowCalls().length}`);
    console.log(`Average response time: ${this.getAverageResponseTime().toFixed(2)}ms`);

    // Group by endpoint
    const byEndpoint = this.groupByEndpoint();
    console.log('\n=== Calls by Endpoint ===');
    Object.entries(byEndpoint).forEach(([endpoint, calls]) => {
      console.log(`${endpoint}: ${calls.length} calls`);
    });

    // Show failed calls
    if (this.getFailedCalls().length > 0) {
      console.log('\n=== Failed API Calls ===');
      this.getFailedCalls().forEach(call => {
        console.log(`[${call.responseStatus}] ${call.method} ${call.endpoint}`);
        if (call.responseBody?.message) {
          console.log(`  Error: ${call.responseBody.message}`);
        }
      });
    }

    // Show slow calls
    if (this.getSlowCalls().length > 0) {
      console.log('\n=== Slow API Calls (>1s) ===');
      this.getSlowCalls().forEach(call => {
        console.log(`[${call.duration}ms] ${call.method} ${call.endpoint}`);
      });
    }
  }

  groupByEndpoint() {
    return this.apiCalls.reduce((acc, call) => {
      if (!acc[call.endpoint]) {
        acc[call.endpoint] = [];
      }
      acc[call.endpoint].push(call);
      return acc;
    }, {});
  }

  // Export to JSON file
  async exportToFile(filename) {
    const data = {
      summary: {
        totalCalls: this.apiCalls.length,
        failedCalls: this.getFailedCalls().length,
        slowCalls: this.getSlowCalls().length,
        averageResponseTime: this.getAverageResponseTime()
      },
      calls: this.apiCalls
    };

    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`\nAPI logs exported to: ${filename}`);
  }

  // Generate detailed report
  generateReport() {
    let report = '# API Call Report\n\n';
    
    report += `## Summary\n`;
    report += `- Total API Calls: ${this.apiCalls.length}\n`;
    report += `- Failed Calls: ${this.getFailedCalls().length}\n`;
    report += `- Slow Calls (>1s): ${this.getSlowCalls().length}\n`;
    report += `- Average Response Time: ${this.getAverageResponseTime().toFixed(2)}ms\n\n`;

    report += `## Calls by Endpoint\n`;
    Object.entries(this.groupByEndpoint()).forEach(([endpoint, calls]) => {
      report += `- ${endpoint}: ${calls.length} calls\n`;
    });

    report += `\n## All API Calls\n`;
    this.apiCalls.forEach((call, index) => {
      report += `\n### ${index + 1}. ${call.method} ${call.endpoint}\n`;
      report += `- Status: ${call.responseStatus || 'N/A'}\n`;
      report += `- Duration: ${call.duration || 'N/A'}ms\n`;
      report += `- Timestamp: ${call.timestamp.toISOString()}\n`;
      
      if (call.requestBody) {
        report += `- Request Body: \`\`\`json\n${JSON.stringify(call.requestBody, null, 2)}\n\`\`\`\n`;
      }
      
      if (call.responseBody) {
        report += `- Response Body: \`\`\`json\n${JSON.stringify(call.responseBody, null, 2)}\n\`\`\`\n`;
      }

      if (call.error) {
        report += `- Error: ${call.error}\n`;
      }
    });

    return report;
  }
}

module.exports = { APILogger };
