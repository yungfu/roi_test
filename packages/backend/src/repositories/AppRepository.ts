import { injectable, inject } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';
import { App } from '../entities/App';

@injectable()
export class AppRepository {
  private repository: Repository<App>;

  constructor(@inject('DataSource') private dataSource: DataSource) {
    this.repository = dataSource.getRepository(App);
  }

  /**
   * 获取所有应用
   */
  async findAll(): Promise<App[]> {
    return this.repository.find({
      relations: ['campaigns']
    });
  }

  /**
   * 根据ID查找应用
   */
  async findById(id: string): Promise<App | null> {
    return this.repository.findOne({ 
      where: { id },
      relations: ['campaigns']
    });
  }

  /**
   * 根据应用名称查找应用
   */
  async findByName(name: string): Promise<App | null> {
    return this.repository.findOne({ 
      where: { name },
      relations: ['campaigns']
    });
  }

  /**
   * 创建新应用
   */
  async create(appData: Partial<App>): Promise<App> {
    const app = this.repository.create(appData);
    return this.repository.save(app);
  }

  /**
   * 更新应用信息
   */
  async update(id: string, appData: Partial<App>): Promise<App | null> {
    await this.repository.update(id, appData);
    return this.findById(id);
  }

  /**
   * 删除应用
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected! > 0;
  }

  /**
   * 检查应用是否存在
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * 根据名称检查应用是否存在
   */
  async existsByName(name: string): Promise<boolean> {
    const count = await this.repository.count({ where: { name } });
    return count > 0;
  }

  /**
   * 获取应用及其活动的统计信息
   */
  async getAppWithCampaignStats(id: string): Promise<{
    app: App | null;
    totalCampaigns: number;
    totalInstalls: number;
    countriesCount: number;
  } | null> {
    const app = await this.repository.findOne({
      where: { id },
      relations: ['campaigns']
    });

    if (!app) {
      return null;
    }

    const totalCampaigns = app.campaigns.length;
    const totalInstalls = app.campaigns.reduce((sum, campaign) => sum + campaign.installCount, 0);
    const countries = new Set(app.campaigns.map(campaign => campaign.country));

    return {
      app,
      totalCampaigns,
      totalInstalls,
      countriesCount: countries.size
    };
  }
}
