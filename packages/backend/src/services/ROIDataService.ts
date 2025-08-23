import { injectable } from 'tsyringe';
import { ROIDataRepository } from '../repositories/ROIDataRepository';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { ROIData } from '../entities/ROIData';

@injectable()
export class ROIDataService {
  constructor(
    private roiDataRepository: ROIDataRepository,
    private campaignRepository: CampaignRepository
  ) {}

  async getAllROIData(): Promise<ROIData[]> {
    return this.roiDataRepository.findAll();
  }

  async getROIDataById(id: string): Promise<ROIData | null> {
    return this.roiDataRepository.findById(id);
  }

  async getROIDataByCampaignId(campaignId: string): Promise<ROIData[]> {
    return this.roiDataRepository.findByCampaignId(campaignId);
  }

  async getROIDataByPeriod(daysPeriod: number): Promise<ROIData[]> {
    return this.roiDataRepository.findByPeriod(daysPeriod);
  }

  async getROIDataByPeriods(daysPeriods: number[]): Promise<ROIData[]> {
    return this.roiDataRepository.findByPeriods(daysPeriods);
  }

  async getROIDataByRange(minROI: number, maxROI?: number): Promise<ROIData[]> {
    return this.roiDataRepository.findByROIRange(minROI, maxROI);
  }

  async getROIDataByAppId(appId: string): Promise<ROIData[]> {
    return this.roiDataRepository.findByAppId(appId);
  }

  async getReal0ROIData(): Promise<ROIData[]> {
    return this.roiDataRepository.findReal0ROI();
  }

  async createROIData(roiData: {
    daysPeriod: number;
    roiValue: number;
    isReal0Roi?: boolean;
    campaignId: string;
  }): Promise<ROIData> {
    // Check if campaign exists
    const campaign = await this.campaignRepository.findById(roiData.campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if ROI data already exists for this campaign and period
    const existingROI = await this.roiDataRepository.findByCampaignIdAndPeriod(
      roiData.campaignId, 
      roiData.daysPeriod
    );
    if (existingROI) {
      throw new Error('ROI data already exists for this campaign and period');
    }

    return this.roiDataRepository.create({
      ...roiData,
      isReal0Roi: roiData.isReal0Roi || false
    });
  }

  async createManyROIData(roiDataList: {
    daysPeriod: number;
    roiValue: number;
    isReal0Roi?: boolean;
    campaignId: string;
  }[]): Promise<ROIData[]> {
    // Validate all campaigns exist
    const campaignIds = [...new Set(roiDataList.map(roi => roi.campaignId))];
    for (const campaignId of campaignIds) {
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }
    }

    // Check for duplicate entries
    for (const roiData of roiDataList) {
      const existingROI = await this.roiDataRepository.findByCampaignIdAndPeriod(
        roiData.campaignId, 
        roiData.daysPeriod
      );
      if (existingROI) {
        throw new Error(`ROI data already exists for campaign ${roiData.campaignId} and period ${roiData.daysPeriod}`);
      }
    }

    const processedData = roiDataList.map(roi => ({
      ...roi,
      isReal0Roi: roi.isReal0Roi || false
    }));

    return this.roiDataRepository.createMany(processedData);
  }

  async updateROIData(id: string, roiData: Partial<ROIData>): Promise<ROIData | null> {
    const existingROI = await this.roiDataRepository.findById(id);
    if (!existingROI) {
      throw new Error('ROI data not found');
    }

    // If updating campaign or period, check for conflicts
    if (roiData.campaignId || roiData.daysPeriod !== undefined) {
      const campaignId = roiData.campaignId || existingROI.campaignId;
      const daysPeriod = roiData.daysPeriod !== undefined ? roiData.daysPeriod : existingROI.daysPeriod;
      
      // Check if campaign exists (if being updated)
      if (roiData.campaignId && roiData.campaignId !== existingROI.campaignId) {
        const campaign = await this.campaignRepository.findById(roiData.campaignId);
        if (!campaign) {
          throw new Error('Campaign not found');
        }
      }

      // Check for duplicates (if campaign or period is being updated)
      if (campaignId !== existingROI.campaignId || daysPeriod !== existingROI.daysPeriod) {
        const conflictingROI = await this.roiDataRepository.findByCampaignIdAndPeriod(campaignId, daysPeriod);
        if (conflictingROI && conflictingROI.id !== id) {
          throw new Error('ROI data already exists for this campaign and period');
        }
      }
    }

    return this.roiDataRepository.update(id, roiData);
  }

  async updateROIDataByCampaignAndPeriod(
    campaignId: string, 
    daysPeriod: number, 
    roiData: Partial<ROIData>
  ): Promise<ROIData | null> {
    const existingROI = await this.roiDataRepository.findByCampaignIdAndPeriod(campaignId, daysPeriod);
    if (!existingROI) {
      throw new Error('ROI data not found for this campaign and period');
    }

    return this.roiDataRepository.updateByCampaignAndPeriod(campaignId, daysPeriod, roiData);
  }

  async deleteROIData(id: string): Promise<boolean> {
    const roiData = await this.roiDataRepository.findById(id);
    if (!roiData) {
      throw new Error('ROI data not found');
    }

    return this.roiDataRepository.delete(id);
  }

  async deleteROIDataByCampaignId(campaignId: string): Promise<boolean> {
    return this.roiDataRepository.deleteByCampaignId(campaignId);
  }

  async getROIDataStatistics() {
    return this.roiDataRepository.getStatistics();
  }

  async getCampaignROITrend(campaignId: string) {
    // Check if campaign exists
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return this.roiDataRepository.getCampaignROITrend(campaignId);
  }

  async getAppAverageROITrend(appId: string) {
    return this.roiDataRepository.getAppAverageROITrend(appId);
  }
}
