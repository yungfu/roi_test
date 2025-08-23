import { injectable } from 'tsyringe';
import { AppRepository } from '../repositories/AppRepository';
import { App } from '../entities/App';

@injectable()
export class AppService {
  // 本地缓存 - 只保留一个统一的应用缓存
  private allAppsCache: App[] | null = null; // 所有应用的缓存
  private cacheTimestamp: number = 0; // 缓存时间戳
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存时间

  constructor(private appRepository: AppRepository) {}

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }

  /**
   * 清空缓存
   */
  private clearCache(): void {
    this.allAppsCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * 更新缓存
   */
  private updateCache(apps: App[]): void {
    this.allAppsCache = apps;
    this.cacheTimestamp = Date.now();
  }

  /**
   * 确保缓存已加载
   */
  private async ensureCacheLoaded(): Promise<App[]> {
    if (this.isCacheValid() && this.allAppsCache) {
      return this.allAppsCache;
    }

    // 从数据库获取所有应用并更新缓存
    const apps = await this.appRepository.findAll();
    this.updateCache(apps);
    return apps;
  }

  /**
   * 添加或更新缓存中的单个App
   */
  private addOrUpdateCache(app: App): void {
    if (!this.allAppsCache) {
      return; // 如果缓存未初始化，不做处理
    }

    const existingIndex = this.allAppsCache.findIndex(a => a.id === app.id);
    if (existingIndex >= 0) {
      this.allAppsCache[existingIndex] = app;
    } else {
      this.allAppsCache.push(app);
    }
  }

  /**
   * 从缓存中移除App
   */
  private removeFromCache(appId: string): void {
    if (!this.allAppsCache) {
      return; // 如果缓存未初始化，不做处理
    }

    this.allAppsCache = this.allAppsCache.filter(a => a.id !== appId);
  }

  async getAllApps(): Promise<App[]> {
    return await this.ensureCacheLoaded();
  }

  async getAppById(id: string): Promise<App | null> {
    const apps = await this.ensureCacheLoaded();
    return apps.find(app => app.id === id) || null;
  }

  async getAppByName(name: string): Promise<App | null> {
    const apps = await this.ensureCacheLoaded();
    return apps.find(app => app.name === name) || null;
  }

  async createApp(appData: { name: string }): Promise<App> {
    // 检查缓存中是否已存在（避免不必要的数据库查询）
    const existingApp = await this.getAppByName(appData.name);
    if (existingApp) {
      throw new Error('App with this name already exists');
    }

    // 创建新应用
    const newApp = await this.appRepository.create(appData);
    
    // 添加到缓存
    this.addOrUpdateCache(newApp);
    
    return newApp;
  }

  async updateApp(id: string, appData: Partial<App>): Promise<App | null> {
    // 从缓存获取现有应用
    const app = await this.getAppById(id);
    
    if (!app) {
      throw new Error('App not found');
    }

    // 检查名称冲突
    if (appData.name && appData.name !== app.name) {
      const existingApp = await this.getAppByName(appData.name);
      if (existingApp) {
        throw new Error('App with this name already exists');
      }
    }

    // 更新数据库
    const updatedApp = await this.appRepository.update(id, appData);
    
    if (updatedApp) {
      // 更新缓存
      this.addOrUpdateCache(updatedApp);
    }
    
    return updatedApp;
  }

  async deleteApp(id: string): Promise<boolean> {
    // 从缓存获取应用
    const app = await this.getAppById(id);
    
    if (!app) {
      throw new Error('App not found');
    }

    // 删除数据库中的应用
    const success = await this.appRepository.delete(id);
    
    if (success) {
      // 从缓存中移除
      this.removeFromCache(id);
    }
    
    return success;
  }

  async getAppWithStats(id: string) {
    // 这个方法涉及复杂的统计查询，不适合缓存
    // 但可以检查应用是否存在时使用缓存
    const app = await this.getAppById(id);
    if (!app) {
      return null;
    }
    
    return this.appRepository.getAppWithCampaignStats(id);
  }

  /**
   * 手动刷新缓存
   */
  async refreshCache(): Promise<void> {
    const apps = await this.appRepository.findAll();
    this.updateCache(apps);
  }

  /**
   * 获取缓存统计信息（用于调试）
   */
  getCacheStats() {
    return {
      allAppsCacheSize: this.allAppsCache?.length || 0,
      isValid: this.isCacheValid(),
      cacheAge: Date.now() - this.cacheTimestamp,
      cacheTTL: this.CACHE_TTL
    };
  }
}
