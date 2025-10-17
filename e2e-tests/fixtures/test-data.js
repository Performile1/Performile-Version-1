// Test Data Fixtures - October 17, 2025
// Test users and data for E2E testing

const TEST_USERS = {
  admin: {
    email: 'admin@performile.com',
    password: 'Test1234!',
    role: 'admin'
  },
  merchant: {
    email: 'merchant@performile.com',
    password: 'Test1234!',
    role: 'merchant'
  },
  courier: {
    email: 'courier@performile.com',
    password: 'Test1234!',
    role: 'courier'
  },
  consumer: {
    email: 'consumer@performile.com',
    password: 'Test1234!',
    role: 'consumer'
  }
};

const TEST_ORDER = {
  customer_email: 'test@example.com',
  customer_name: 'Test Customer',
  delivery_address: '123 Test Street',
  postal_code: '12345',
  city: 'Stockholm',
  country: 'Sweden',
  package_weight: 2.5,
  package_dimensions: '30x20x10'
};

module.exports = {
  TEST_USERS,
  TEST_ORDER
};
