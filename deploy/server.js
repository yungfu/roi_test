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

console.log('Azure deployment starting...');
console.log('Current working directory:', process.cwd());
console.log('Server file location:', __dirname);

// List contents for debugging
try {
    const fs = require('fs');
    console.log('Contents of current directory:', fs.readdirSync(process.cwd()));
    if (fs.existsSync('./public')) {
        console.log('Public directory exists');
        console.log('Public directory contents:', fs.readdirSync('./public').slice(0, 10));
    } else {
        console.log('❌ Public directory not found');
    }
    if (fs.existsSync('./dist')) {
        console.log('Dist directory exists');
    } else {
        console.log('❌ Dist directory not found');
    }
} catch (err) {
    console.error('Error listing directories:', err);
}

// Load the main application
require('./dist/index.js');
