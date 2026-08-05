// Deliberately loads .env.test (not the default .env, which holds live
// production credentials in local dev setups) — see .env.test for why.
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.test') });
