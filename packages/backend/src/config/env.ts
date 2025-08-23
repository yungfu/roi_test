import { config } from 'dotenv';
import path from 'path';

// Load environment-specific .env file
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;
const envPath = path.resolve(process.cwd(), envFile);

// Try to load environment-specific file first
config({ path: envPath });

// Fallback to .env if environment-specific file doesn't exist
config();

console.log(`Loading environment configuration from: ${envFile}`);
console.log(`Database Host: ${process.env.DB_HOST}`);
console.log(`Database Name: ${process.env.DB_DATABASE}`);
console.log(`Environment: ${process.env.NODE_ENV}`);
