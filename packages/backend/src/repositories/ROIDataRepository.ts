import { injectable, inject } from 'tsyringe';
import { DataSource, Repository, In } from 'typeorm';
import { ROIData } from '../entities/ROIData';

@injectable()
export class ROIDataRepository {
  private repository: Repository<ROIData>;

  constructor(@inject('DataSource') private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ROIData);
  }

  /**
   * 获取所有ROI数据
   */
  async findAll(): Promise<ROIData[]> {
    return this.repository.find({
      relations: ['campaign', 'campaign.app']
    });
  }

  /**
   * 根据ID查找ROI数据
   */
  async findById(id: string): Promise<ROIData | null> {
    return this.repository.findOne({ 
      where: { id },
      relations: ['campaign', 'campaign.app']
    });
  }

  /**
   * 根据活动ID查找ROI数据
   */
  async findByCampaignId(campaignId: string): Promise<ROIData[]> {
    return this.repository.find({ 
      where: { campaignId },
      relations: ['campaign', 'campaign.app'],
      order: { daysPeriod: 'ASC' }
    });
  }

  /**
   * 根据活动ID和周期查找ROI数据
   */
  async findByCampaignIdAndPeriod(campaignId: string, daysPeriod: number): Promise<ROIData | null> {
    return this.repository.findOne({ 
      where: { campaignId, daysPeriod },
      relations: ['campaign', 'campaign.app']
    });
  }

  /**
   * 根据周期查找ROI数据
   */
  async findByPeriod(daysPeriod: number): Promise<ROIData[]> {
    return this.repository.find({ 
      where: { daysPeriod },
      relations: ['campaign', 'campaign.app']
    });
  }

  /**
   * 根据多个周期查找ROI数据
   */
  async findByPeriods(daysPeriods: number[]): Promise<ROIData[]> {
    return this.repository.find({ 
      where: { daysPeriod: In(daysPeriods) },
      relations: ['campaign', 'campaign.app'],
      order: { daysPeriod: 'ASC' }
    });
  }

  /**
   * 根据ROI值范围查找数据
   */
  async findByROIRange(minROI: number, maxROI?: number): Promise<ROIData[]> {
    const queryBuilder = this.repository.createQueryBuilder('roi')
      .leftJoinAndSelect('roi.campaign', 'campaign')
      .leftJoinAndSelect('campaign.app', 'app')
      .where('roi.roiValue >= :minROI', { minROI });

    if (maxROI !== undefined) {
      queryBuilder.andWhere('roi.roiValue <= :maxROI', { maxROI });
    }

    return queryBuilder.getMany();
  }

  /**
   * 根据应用ID查找ROI数据
   */
  async findByAppId(appId: string): Promise<ROIData[]> {
    return this.repository.find({ 
      where: { campaign: { appId } },
      relations: ['campaign', 'campaign.app'],
      order: { daysPeriod: 'ASC' }
    });
  }

  /**
   * 查找真实的0 ROI数据
   */
  async findReal0ROI(): Promise<ROIData[]> {
    return this.repository.find({ 
      where: { isReal0Roi: true },
      relations: ['campaign', 'campaign.app']
    });
  }

  /**
   * 创建新ROI数据
   */
  async create(roiData: Partial<ROIData>): Promise<ROIData> {
    const roi = this.repository.create(roiData);
    return this.repository.save(roi);
  }

  /**
   * 批量创建ROI数据
   */
  async createMany(roiDataList: Partial<ROIData>[]): Promise<ROIData[]> {
    const rois = this.repository.create(roiDataList);
    return this.repository.save(rois);
  }

  /**
   * 更新ROI数据
   */
  async update(id: string, roiData: Partial<ROIData>): Promise<ROIData | null> {
    await this.repository.update(id, roiData);
    return this.findById(id);
  }

  /**
   * 根据活动ID和周期更新ROI数据
   */
  async updateByCampaignAndPeriod(
    campaignId: string, 
    daysPeriod: number, 
    roiData: Partial<ROIData>
  ): Promise<ROIData | null> {
    await this.repository.update({ campaignId, daysPeriod }, roiData);
    return this.findByCampaignIdAndPeriod(campaignId, daysPeriod);
  }

  /**
   * 删除ROI数据
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected! > 0;
  }

  /**
   * 根据活动ID删除ROI数据
   */
  async deleteByCampaignId(campaignId: string): Promise<boolean> {
    const result = await this.repository.delete({ campaignId });
    return result.affected! > 0;
  }

  /**
   * 检查ROI数据是否存在
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * 检查特定活动和周期的ROI数据是否存在
   */
  async existsByCampaignAndPeriod(campaignId: string, daysPeriod: number): Promise<boolean> {
    const count = await this.repository.count({ where: { campaignId, daysPeriod } });
    return count > 0;
  }

  /**
   * 获取ROI数据统计信息
   */
  async getStatistics(): Promise<{
    totalRecords: number;
    averageROI: number;
    maxROI: number;
    minROI: number;
    periodsDistribution: { period: number; count: number }[];
    real0ROICount: number;
  }> {
    const totalRecords = await this.repository.count();
    
    const roiStats = await this.repository
      .createQueryBuilder('roi')
      .select('AVG(roi.roiValue)', 'averageROI')
      .addSelect('MAX(roi.roiValue)', 'maxROI')
      .addSelect('MIN(roi.roiValue)', 'minROI')
      .getRawOne();

    const periodsStats = await this.repository
      .createQueryBuilder('roi')
      .select('roi.daysPeriod', 'period')
      .addSelect('COUNT(*)', 'count')
      .groupBy('roi.daysPeriod')
      .orderBy('roi.daysPeriod', 'ASC')
      .getRawMany();

    const real0ROICount = await this.repository.count({ where: { isReal0Roi: true } });

    return {
      totalRecords,
      averageROI: parseFloat(roiStats.averageROI) || 0,
      maxROI: parseFloat(roiStats.maxROI) || 0,
      minROI: parseFloat(roiStats.minROI) || 0,
      periodsDistribution: periodsStats.map(stat => ({
        period: parseInt(stat.period),
        count: parseInt(stat.count)
      })),
      real0ROICount
    };
  }

  /**
   * 获取活动的ROI趋势数据
   */
  async getCampaignROITrend(campaignId: string): Promise<{
    campaignId: string;
    roiTrend: { daysPeriod: number; roiValue: number; isReal0Roi: boolean }[];
  }> {
    const roiData = await this.repository.find({
      where: { campaignId },
      order: { daysPeriod: 'ASC' }
    });

    return {
      campaignId,
      roiTrend: roiData.map(roi => ({
        daysPeriod: roi.daysPeriod,
        roiValue: Number(roi.roiValue),
        isReal0Roi: roi.isReal0Roi
      }))
    };
  }

  /**
   * 获取应用的平均ROI趋势
   */
  async getAppAverageROITrend(appId: string): Promise<{
    appId: string;
    averageROITrend: { daysPeriod: number; averageROI: number; campaignCount: number }[];
  }> {
    const trendData = await this.repository
      .createQueryBuilder('roi')
      .leftJoin('roi.campaign', 'campaign')
      .where('campaign.appId = :appId', { appId })
      .select('roi.daysPeriod', 'daysPeriod')
      .addSelect('AVG(roi.roiValue)', 'averageROI')
      .addSelect('COUNT(DISTINCT roi.campaignId)', 'campaignCount')
      .groupBy('roi.daysPeriod')
      .orderBy('roi.daysPeriod', 'ASC')
      .getRawMany();

    return {
      appId,
      averageROITrend: trendData.map(trend => ({
        daysPeriod: parseInt(trend.daysPeriod),
        averageROI: parseFloat(trend.averageROI),
        campaignCount: parseInt(trend.campaignCount)
      }))
    };
  }
}
