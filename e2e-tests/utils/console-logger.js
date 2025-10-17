// Console Logger Utility - October 17, 2025
// Captures and analyzes console output during tests

class ConsoleLogger {
  constructor(page) {
    this.page = page;
    this.logs = [];
    this.setupListeners();
  }

  setupListeners() {
    this.page.on('console', msg => {
      this.logs.push({
        type: msg.type(),
        message: msg.text(),
        timestamp: new Date()
      });
    });

    this.page.on('pageerror', error => {
      this.logs.push({
        type: 'error',
        message: error.message,
        timestamp: new Date()
      });
    });
  }

  getLogs() {
    return this.logs;
  }

  getErrors() {
    return this.logs.filter(log => log.type === 'error');
  }

  getWarnings() {
    return this.logs.filter(log => log.type === 'warning');
  }

  clear() {
    this.logs = [];
  }

  printSummary() {
    console.log('\n=== Console Summary ===');
    console.log(`Total logs: ${this.logs.length}`);
    console.log(`Errors: ${this.getErrors().length}`);
    console.log(`Warnings: ${this.getWarnings().length}`);
    
    if (this.getErrors().length > 0) {
      console.log('\n=== Console Errors ===');
      this.getErrors().forEach(log => {
        console.log(`[${log.timestamp.toISOString()}] ${log.message}`);
      });
    }
  }
}

module.exports = { ConsoleLogger };
