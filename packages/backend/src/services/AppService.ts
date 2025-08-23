import { injectable } from 'tsyringe';
import { AppRepository } from '../repositories/AppRepository';
import { App } from '../entities/App';

@injectable()
export class AppService {
  constructor(private appRepository: AppRepository) {}

  async getAllApps(): Promise<App[]> {
    return this.appRepository.findAll();
  }

  async getAppById(id: string): Promise<App | null> {
    return this.appRepository.findById(id);
  }

  async getAppByName(name: string): Promise<App | null> {
    return this.appRepository.findByName(name);
  }

  async createApp(appData: { name: string }): Promise<App> {
    // Check if app already exists
    const existingApp = await this.appRepository.findByName(appData.name);
    if (existingApp) {
      throw new Error('App with this name already exists');
    }

    return this.appRepository.create(appData);
  }

  async updateApp(id: string, appData: Partial<App>): Promise<App | null> {
    const app = await this.appRepository.findById(id);
    if (!app) {
      throw new Error('App not found');
    }

    // Check if new name conflicts with existing app
    if (appData.name && appData.name !== app.name) {
      const existingApp = await this.appRepository.findByName(appData.name);
      if (existingApp) {
        throw new Error('App with this name already exists');
      }
    }

    return this.appRepository.update(id, appData);
  }

  async deleteApp(id: string): Promise<boolean> {
    const app = await this.appRepository.findById(id);
    if (!app) {
      throw new Error('App not found');
    }

    return this.appRepository.delete(id);
  }

  async getAppWithStats(id: string) {
    return this.appRepository.getAppWithCampaignStats(id);
  }
}
