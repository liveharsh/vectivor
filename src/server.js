// Fallback redirect for deployment configurations pointing to src/server.js
const path = require('path');
require(path.join(__dirname, '..', 'server.js'));
