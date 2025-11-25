const axios = require('axios');

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const endpoints = [
  '/',
  '/api/system/status',
  '/api/system/status?deep=true',
  '/api/analytics/overview',
  '/dashboard',
  '/api/docs',
];

const timeout = 15000;

(async () => {
  console.log(`Health check base: ${BASE}`);
  let failed = false;

  for (const path of endpoints) {
    const url = `${BASE}${path}`;
    process.stdout.write(`Checking ${url} ... `);
    try {
      const res = await axios.get(url, { timeout });
      console.log(`OK (${res.status})`);
    } catch (err) {
      failed = true;
      const msg = err.response ? `${err.response.status} ${err.response.statusText}` : err.message;
      console.log(`FAIL - ${msg}`);
    }
  }

  if (failed) {
    console.error('One or more checks failed');
    process.exit(1);
  }

  console.log('All checks passed');
  process.exit(0);
})();
