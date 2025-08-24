// Azure-specific startup script
const path = require('path');

// Set production environment
process.env.NODE_ENV = 'production';

// Azure uses PORT environment variable
if (process.env.PORT) {
    process.env.PORT = process.env.PORT;
} else {
    process.env.PORT = 8080;
}

// Load the main application
require('./dist/index.js');
