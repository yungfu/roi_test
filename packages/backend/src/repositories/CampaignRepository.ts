import { injectable, inject } from 'tsyringe';
import { DataSource, Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Campaign } from '../entities/Campaign';

@injectable()
export class CampaignRepository {
  private repository: Repository<Campaign>;

  constructor(@inject('DataSource') private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Campaign);
  }

  /**
   * 获取所有活动
   */
  async findAll(): Promise<Campaign[]> {
    return this.repository.find({
      relations: ['app', 'roiData']
    });
  }

  /**
   * 根据ID查找活动
   */
  async findById(id: string): Promise<Campaign | null> {
    return this.repository.findOne({ 
      where: { id },
      relations: ['app', 'roiData']
    });
  }

  /**
   * 根据应用ID查找活动
   */
  async findByAppId(appId: string): Promise<Campaign[]> {
    return this.repository.find({ 
      where: { appId },
      relations: ['app', 'roiData']
    });
  }

  /**
   * 根据国家查找活动
   */
  async findByCountry(country: string): Promise<Campaign[]> {
    return this.repository.find({ 
      where: { country },
      relations: ['app', 'roiData']
    });
  }

  /**
   * 根据出价类型查找活动
   */
  async findByBidType(bidType: string): Promise<Campaign[]> {
    return this.repository.find({ 
      where: { bidType },
      relations: ['app', 'roiData']
    });
  }

  /**
   * 根据投放日期范围查找活动
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Campaign[]> {
    return this.repository.find({
      where: {
        placementDate: Between(startDate, endDate)
      },
      relations: ['app', 'roiData']
    });
  }

  /**
   * 根据投放日期查找活动
   */
  async findByPlacementDate(date: Date): Promise<Campaign[]> {
    return this.repository.find({
      where: { placementDate: date },
      relations: ['app', 'roiData']
    });
  }

  /**
   * 根据安装次数范围查找活动
   */
  async findByInstallCountRange(minInstalls: number, maxInstalls?: number): Promise<Campaign[]> {
    const where: any = {
      installCount: MoreThanOrEqual(minInstalls)
    };
    
    if (maxInstalls !== undefined) {
      where.installCount = Between(minInstalls, maxInstalls);
    }

    return this.repository.find({
      where,
      relations: ['app', 'roiData']
    });
  }

  /**
   * 根据多个条件查找活动
   */
  async findByFilters(filters: {
    appId?: string;
    country?: string;
    bidType?: string;
    startDate?: Date;
    endDate?: Date;
    minInstalls?: number;
    maxInstalls?: number;
  }): Promise<Campaign[]> {
    const where: any = {};

    if (filters.appId) {
      where.appId = filters.appId;
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.bidType) {
      where.bidType = filters.bidType;
    }

    if (filters.startDate && filters.endDate) {
      where.placementDate = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      where.placementDate = MoreThanOrEqual(filters.startDate);
    } else if (filters.endDate) {
      where.placementDate = LessThanOrEqual(filters.endDate);
    }

    if (filters.minInstalls !== undefined) {
      if (filters.maxInstalls !== undefined) {
        where.installCount = Between(filters.minInstalls, filters.maxInstalls);
      } else {
        where.installCount = MoreThanOrEqual(filters.minInstalls);
      }
    }

    return this.repository.find({
      where,
      relations: ['app', 'roiData']
    });
  }

  /**
   * 创建新活动
   */
  async create(campaignData: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.repository.create(campaignData);
    return this.repository.save(campaign);
  }

  /**
   * 批量创建活动 - 提高导入效率
   */
  async createMany(campaignDataList: Partial<Campaign>[]): Promise<Campaign[]> {
    if (!campaignDataList || campaignDataList.length === 0) {
      return [];
    }

    const campaigns = this.repository.create(campaignDataList);
    return this.repository.save(campaigns);
  }

  /**
   * 批量插入活动 - 使用 INSERT 语句，更高效
   */
  async bulkInsert(campaignDataList: Partial<Campaign>[]): Promise<{ identifiers: any[]; generatedMaps: any[] }> {
    if (!campaignDataList || campaignDataList.length === 0) {
      return { identifiers: [], generatedMaps: [] };
    }

    return this.repository.insert(campaignDataList);
  }

  /**
   * 更新活动信息
   */
  async update(id: string, campaignData: Partial<Campaign>): Promise<Campaign | null> {
    await this.repository.update(id, campaignData);
    return this.findById(id);
  }

  /**
   * 删除活动
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected! > 0;
  }

  /**
   * 检查活动是否存在
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * 获取活动统计信息
   */
  async getStatistics(): Promise<{
    totalCampaigns: number;
    totalInstalls: number;
    averageInstalls: number;
    countryDistribution: { country: string; count: number }[];
    bidTypeDistribution: { bidType: string; count: number }[];
  }> {
    const totalCampaigns = await this.repository.count();
    
    const installStats = await this.repository
      .createQueryBuilder('campaign')
      .select('SUM(campaign.installCount)', 'totalInstalls')
      .addSelect('AVG(campaign.installCount)', 'averageInstalls')
      .getRawOne();

    const countryStats = await this.repository
      .createQueryBuilder('campaign')
      .select('campaign.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .groupBy('campaign.country')
      .getRawMany();

    const bidTypeStats = await this.repository
      .createQueryBuilder('campaign')
      .select('campaign.bidType', 'bidType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('campaign.bidType')
      .getRawMany();

    return {
      totalCampaigns,
      totalInstalls: parseInt(installStats.totalInstalls) || 0,
      averageInstalls: parseFloat(installStats.averageInstalls) || 0,
      countryDistribution: countryStats.map(stat => ({
        country: stat.country,
        count: parseInt(stat.count)
      })),
      bidTypeDistribution: bidTypeStats.map(stat => ({
        bidType: stat.bidType,
        count: parseInt(stat.count)
      }))
    };
  }
}
