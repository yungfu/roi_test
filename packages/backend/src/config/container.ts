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
import { ROIFileImportService } from '../services/ROIFileImportService';
import { StatisticsService } from '../services/StatisticsService';

// Controllers
import { ROIFilesController } from '../controllers/ROIFilesController';
import { StatisticsController } from '../controllers/StatisticsController';

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
container.registerSingleton<ROIFileImportService>(ROIFileImportService);
container.registerSingleton<StatisticsService>(StatisticsService);

// Register Controllers
container.registerSingleton<ROIFilesController>(ROIFilesController);
container.registerSingleton<StatisticsController>(StatisticsController);

export { container };
