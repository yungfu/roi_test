import { injectable } from 'tsyringe';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { AppRepository } from '../repositories/AppRepository';
import { Campaign } from '../entities/Campaign';

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
