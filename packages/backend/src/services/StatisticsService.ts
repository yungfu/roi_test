import { injectable } from 'tsyringe';
import { AppRepository } from '../repositories/AppRepository';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { ROIDataRepository } from '../repositories/ROIDataRepository';

export interface StatisticsQuery {
  appName?: string;
  bidType?: string;
  country?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface StatisticsResultItem {
  placementDate: string; // 投放日期
  appName: string; // 应用名称
  country: string; // 国家地区
  bidType: string; // 出价类型
  installCount: number; // 安装次数
  roi: {
    day0?: { value: number; isReal0Roi: boolean }; // 当日ROI
    day1?: { value: number; isReal0Roi: boolean }; // 1日ROI
    day3?: { value: number; isReal0Roi: boolean }; // 3日ROI
    day7?: { value: number; isReal0Roi: boolean }; // 7日ROI
    day14?: { value: number; isReal0Roi: boolean }; // 14日ROI
    day30?: { value: number; isReal0Roi: boolean }; // 30日ROI
    day60?: { value: number; isReal0Roi: boolean }; // 60日ROI
    day90?: { value: number; isReal0Roi: boolean }; // 90日ROI
  };
}

export interface StatisticsResult {
  data: StatisticsResultItem[];
}

@injectable()
export class StatisticsService {
  constructor(
    private appRepository: AppRepository,
    private campaignRepository: CampaignRepository,
    private roiDataRepository: ROIDataRepository
  ) {}

  async getStatistics(query: StatisticsQuery): Promise<StatisticsResult> {
    // 使用现有Repository方法构建查询
    let campaigns = await this.campaignRepository.findAll();

    // 应用筛选条件
    if (query.appName) {
      campaigns = campaigns.filter(campaign => campaign.app.name === query.appName);
    }
    if (query.bidType) {
      campaigns = campaigns.filter(campaign => campaign.bidType === query.bidType);
    }
    if (query.country) {
      campaigns = campaigns.filter(campaign => campaign.country === query.country);
    }
    if (query.startDate) {
      campaigns = campaigns.filter(campaign => 
        new Date(campaign.placementDate) >= query.startDate!
      );
    }
    if (query.endDate) {
      campaigns = campaigns.filter(campaign => 
        new Date(campaign.placementDate) <= query.endDate!
      );
    }

    // 排序
    campaigns.sort((a, b) => {
      const dateCompare = new Date(b.placementDate).getTime() - new Date(a.placementDate).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      const appCompare = a.app.name.localeCompare(b.app.name);
      if (appCompare !== 0) return appCompare;
      
      return a.country.localeCompare(b.country);
    });

    // 转换数据格式
    const data: StatisticsResultItem[] = campaigns.map(campaign => {
      const roi: StatisticsResultItem['roi'] = {};
      
      // 处理ROI数据
      campaign.roiData.forEach(roiData => {
        const key = `day${roiData.daysPeriod}` as keyof StatisticsResultItem['roi'];
        roi[key] = {
          value: Number(roiData.roiValue),
          isReal0Roi: roiData.isReal0Roi
        };
      });

      return {
        placementDate: campaign.placementDate.toISOString().split('T')[0], // 格式化为 YYYY-MM-DD
        appName: campaign.app.name,
        country: campaign.country,
        bidType: campaign.bidType,
        installCount: campaign.installCount,
        roi
      };
    });

    return {
      data
    };
  }

  // 获取可用的筛选选项
  async getFilterOptions(): Promise<{
    apps: string[];
    countries: string[];
    bidTypes: string[];
  }> {
    const [apps, campaigns] = await Promise.all([
      this.appRepository.findAll(),
      this.campaignRepository.findAll()
    ]);

    const countries = [...new Set(campaigns.map(c => c.country))].sort();
    const bidTypes = [...new Set(campaigns.map(c => c.bidType))].sort();
    const appNames = apps.map(app => app.name).sort();

    return {
      apps: appNames,
      countries,
      bidTypes
    };
  }
}
