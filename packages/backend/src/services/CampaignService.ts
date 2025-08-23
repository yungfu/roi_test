import { injectable } from 'tsyringe';
import { Campaign } from '../entities/Campaign';
import { AppRepository } from '../repositories/AppRepository';
import { CampaignRepository } from '../repositories/CampaignRepository';

@injectable()
export class CampaignService {
  constructor(
    private campaignRepository: CampaignRepository,
    private appRepository: AppRepository
  ) {}

  async getAllCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.findAll();
  }

  async getCampaignById(id: string): Promise<Campaign | null> {
    return this.campaignRepository.findById(id);
  }

  async getCampaignsByAppId(appId: string): Promise<Campaign[]> {
    return this.campaignRepository.findByAppId(appId);
  }

  async getCampaignsByCountry(country: string): Promise<Campaign[]> {
    return this.campaignRepository.findByCountry(country);
  }

  async getCampaignsByBidType(bidType: string): Promise<Campaign[]> {
    return this.campaignRepository.findByBidType(bidType);
  }

  async getCampaignsByDateRange(startDate: Date, endDate: Date): Promise<Campaign[]> {
    return this.campaignRepository.findByDateRange(startDate, endDate);
  }

  async getCampaignsByFilters(filters: {
    appId?: string;
    country?: string;
    bidType?: string;
    startDate?: Date;
    endDate?: Date;
    minInstalls?: number;
    maxInstalls?: number;
  }): Promise<Campaign[]> {
    return this.campaignRepository.findByFilters(filters);
  }

  async createCampaign(campaignData: {
    placementDate: Date;
    bidType: string;
    installCount: number;
    country: string;
    appId: string;
  }): Promise<Campaign> {
    // Check if app exists
    const app = await this.appRepository.findById(campaignData.appId);
    if (!app) {
      throw new Error('App not found');
    }

    return this.campaignRepository.create(campaignData);
  }

  /**
   * 批量创建活动 - 提高导入效率
   */
  async createCampaigns(campaignDataList: {
    placementDate: Date;
    bidType: string;
    installCount: number;
    country: string;
    appId: string;
  }[]): Promise<Campaign[]> {
    if (!campaignDataList || campaignDataList.length === 0) {
      return [];
    }

    return this.campaignRepository.createMany(campaignDataList);
  }

  /**
   * 批量插入活动 - 使用 INSERT 语句，不返回完整实体
   */
  async bulkInsertCampaigns(campaignDataList: {
    placementDate: Date;
    bidType: string;
    installCount: number;
    country: string;
    appId: string;
  }[]): Promise<{ identifiers: any[]; generatedMaps: any[] }> {
    if (!campaignDataList || campaignDataList.length === 0) {
      return { identifiers: [], generatedMaps: [] };
    }

    // 验证所有app是否存在
    const uniqueAppIds = [...new Set(campaignDataList.map(data => data.appId))];
    for (const appId of uniqueAppIds) {
      const app = await this.appRepository.findById(appId);
      if (!app) {
        throw new Error(`App not found: ${appId}`);
      }
    }

    return this.campaignRepository.bulkInsert(campaignDataList);
  }

  async updateCampaign(id: string, campaignData: Partial<Campaign>): Promise<Campaign | null> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if new app exists (if appId is being updated)
    if (campaignData.appId && campaignData.appId !== campaign.appId) {
      const app = await this.appRepository.findById(campaignData.appId);
      if (!app) {
        throw new Error('App not found');
      }
    }

    return this.campaignRepository.update(id, campaignData);
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return this.campaignRepository.delete(id);
  }

  async getCampaignStatistics() {
    return this.campaignRepository.getStatistics();
  }
}
