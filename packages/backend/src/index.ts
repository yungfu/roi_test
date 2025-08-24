import 'reflect-metadata';
import './config/env'; // Load environment configuration first
import './config/container'; // Import container configuration
import app from './app';
import { AppDataSource } from './config/database';
import { Client } from 'pg';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // First, try to enable UUID extension using a direct PostgreSQL connection
    console.log('Attempting to enable UUID extension...');
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'roianalyze',
      ssl: true,
    });

    try {
      await client.connect();
      console.log('Connected to PostgreSQL for extension setup');
      
      // Try different UUID extension options
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('UUID extension "uuid-ossp" enabled successfully');
      } catch (uuidOsspError) {
        console.warn('uuid-ossp extension failed, trying pgcrypto:', uuidOsspError);
        try {
          await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
          console.log('UUID extension "pgcrypto" enabled successfully');
        } catch (pgcryptoError) {
          console.warn('pgcrypto extension also failed:', pgcryptoError);
          console.log('Continuing without explicit UUID extension - database may already support UUIDs');
        }
      }
      
      await client.end();
    } catch (extensionError) {
      console.warn('Could not set up UUID extension:', extensionError);
      console.log('Continuing with database initialization...');
    }

    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection established successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
