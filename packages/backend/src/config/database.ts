import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'roianalyze',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../entities/*.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  subscribers: [__dirname + '/../subscribers/*.{ts,js}'],
  ssl: true,
  extra: {
    max: parseInt(process.env.DB_CONNECTION_POOL_SIZE || '10'),
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000,    // Increased to 60 seconds for Azure
    acquireTimeoutMillis: 60000,       // Time to wait for a connection from pool
    createTimeoutMillis: 60000,        // Time to wait for connection creation
    destroyTimeoutMillis: 5000,        // Time to wait for connection destruction
    reapIntervalMillis: 1000,          // Cleanup interval
    createRetryIntervalMillis: 200,    // Retry interval for connection creation
  },
});
