import 'reflect-metadata';
import './config/env'; // Load environment configuration first
import './config/container'; // Import container configuration
import app from './app';
import { AppDataSource } from './config/database';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
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
