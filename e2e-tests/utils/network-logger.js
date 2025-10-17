// Network Logger Utility - October 17, 2025
// Monitors and analyzes network requests during tests

class NetworkLogger {
  constructor(page) {
    this.page = page;
    this.requests = [];
    this.setupListeners();
  }

  setupListeners() {
    this.page.on('request', request => {
      this.requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date()
      });
    });

    this.page.on('response', response => {
      const request = this.requests.find(r => r.url === response.url());
      if (request) {
        request.status = response.status();
      }
    });
  }

  getRequests() {
    return this.requests;
  }

  getAPIRequests() {
    return this.requests.filter(r => r.url.includes('/api/'));
  }

  getFailedRequests() {
    return this.requests.filter(r => r.status && r.status >= 400);
  }

  clear() {
    this.requests = [];
  }

  printSummary() {
    console.log('\n=== Network Summary ===');
    console.log(`Total requests: ${this.requests.length}`);
    console.log(`API requests: ${this.getAPIRequests().length}`);
    console.log(`Failed requests: ${this.getFailedRequests().length}`);
    
    if (this.getFailedRequests().length > 0) {
      console.log('\n=== Failed Requests ===');
      this.getFailedRequests().forEach(req => {
        console.log(`[${req.status}] ${req.method} ${req.url}`);
      });
    }
  }
}

module.exports = { NetworkLogger };
