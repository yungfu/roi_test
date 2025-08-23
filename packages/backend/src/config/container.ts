import 'reflect-metadata';
import { container } from 'tsyringe';
import { DataSource } from 'typeorm';
import { AppDataSource } from './database';

// Register DataSource
container.registerInstance<DataSource>('DataSource', AppDataSource);

export { container };
