import 'reflect-metadata';
import { container } from 'tsyringe';
import { DataSource } from 'typeorm';
import { AppDataSource } from './database';

// Repositories
import { AppRepository } from '../repositories/AppRepository';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { ROIDataRepository } from '../repositories/ROIDataRepository';

// Services
import { AppService } from '../services/AppService';
import { CampaignService } from '../services/CampaignService';
import { ROIDataService } from '../services/ROIDataService';

// Register DataSource
container.registerInstance<DataSource>('DataSource', AppDataSource);

// Register Repositories
container.registerSingleton<AppRepository>(AppRepository);
container.registerSingleton<CampaignRepository>(CampaignRepository);
container.registerSingleton<ROIDataRepository>(ROIDataRepository);

// Register Services
container.registerSingleton<AppService>(AppService);
container.registerSingleton<CampaignService>(CampaignService);
container.registerSingleton<ROIDataService>(ROIDataService);

export { container };
