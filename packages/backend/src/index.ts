import app from './app';
import { AppDataSource } from './config/database';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize database connection
    // todo: create database 
    // await AppDataSource.initialize();
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
