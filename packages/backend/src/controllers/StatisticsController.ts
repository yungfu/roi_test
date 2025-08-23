import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { StatisticsQuery, StatisticsService } from '../services/StatisticsService';

@injectable()
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  // GET /api/statistics - 获取统计数据
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const query: StatisticsQuery = {};

      // 解析查询参数
      if (req.query.appName && typeof req.query.appName === 'string') {
        query.appName = req.query.appName;
      }
      if (req.query.bidType && typeof req.query.bidType === 'string') {
        query.bidType = req.query.bidType;
      }
      if (req.query.country && typeof req.query.country === 'string') {
        query.country = req.query.country;
      }

      const result = await this.statisticsService.getStatistics(query);

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/satistics/filters - 获取可用的筛选选项
  async getFilterOptions(req: Request, res: Response): Promise<void> {
    try {
      const options = await this.statisticsService.getFilterOptions();

      res.status(200).json({
        success: true,
        message: 'Filter options retrieved successfully',
        data: options
      });
    } catch (error) {
      console.error('Filter options error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching filter options',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
