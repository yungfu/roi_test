import { inject, injectable } from 'tsyringe';
import { DataSource } from 'typeorm';
import { Campaign } from '../entities/Campaign';
import { AppRepository } from '../repositories/AppRepository';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { ROIDataRepository } from '../repositories/ROIDataRepository';

export interface StatisticsQuery {
  appName?: string;
  bidType?: string;
  country?: string;
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
    private roiDataRepository: ROIDataRepository,
    @inject('DataSource') private dataSource: DataSource
  ) {}

  async getStatistics(query: StatisticsQuery): Promise<StatisticsResult> {
    // 使用优化的JOIN查询代替分别从不同repository获取数据
    // 以Campaign为主表，一次性获取App和ROIData的关联数据，避免N+1查询问题
    const campaigns = await this.getOptimizedCampaignsWithJoin(query);

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
        placementDate: campaign.placementDate, // 格式化为 YYYY-MM-DD
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

  /**
   * 使用JOIN查询优化数据获取 - 私有方法
   * 以Campaign为主表，一次性获取所有关联数据，避免加载所有数据到内存后再筛选
   * 将筛选条件放在数据库查询层面，提高查询效率
   */
  private async getOptimizedCampaignsWithJoin(query: StatisticsQuery): Promise<Campaign[]> {
    const repository = this.dataSource.getRepository(Campaign);
    
    const queryBuilder = repository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.app', 'app')
      .leftJoinAndSelect('campaign.roiData', 'roiData')
      .orderBy('campaign.placementDate', 'DESC')
      .addOrderBy('app.name', 'ASC')
      .addOrderBy('campaign.country', 'ASC');

    // 应用筛选条件 - 在数据库层面进行过滤，而不是在内存中过滤
    if (query.appName) {
      queryBuilder.andWhere('app.name = :appName', { appName: query.appName });
    }
    
    if (query.bidType) {
      queryBuilder.andWhere('campaign.bidType = :bidType', { bidType: query.bidType });
    }
    
    if (query.country) {
      queryBuilder.andWhere('campaign.country = :country', { country: query.country });
    }
    
    return queryBuilder.getMany();
  }

  // 获取可用的筛选选项 - 也进行了优化
  async getFilterOptions(): Promise<{
    apps: string[];
    countries: string[];
    bidTypes: string[];
  }> {
    // 使用聚合查询优化筛选选项获取，避免加载所有数据
    const repository = this.dataSource.getRepository(Campaign);
    
    const [appResults, countryResults, bidTypeResults] = await Promise.all([
      // 获取所有不重复的应用名称
      repository
        .createQueryBuilder('campaign')
        .leftJoin('campaign.app', 'app')
        .select('DISTINCT app.name', 'name')
        .orderBy('app.name', 'ASC')
        .getRawMany(),
      
      // 获取所有不重复的国家
      repository
        .createQueryBuilder('campaign')
        .select('DISTINCT campaign.country', 'country')
        .orderBy('campaign.country', 'ASC')
        .getRawMany(),
      
      // 获取所有不重复的出价类型
      repository
        .createQueryBuilder('campaign')
        .select('DISTINCT campaign.bidType', 'bidType')
        .orderBy('campaign.bidType', 'ASC')
        .getRawMany()
    ]);

    return {
      apps: appResults.map(result => result.name).filter(name => name),
      countries: countryResults.map(result => result.country).filter(country => country),
      bidTypes: bidTypeResults.map(result => result.bidType).filter(bidType => bidType)
    };
  }
}
