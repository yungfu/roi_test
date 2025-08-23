import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { StatisticsService, StatisticsQuery } from '../services/StatisticsService';

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
      if (req.query.startDate && typeof req.query.startDate === 'string') {
        query.startDate = new Date(req.query.startDate);
        if (isNaN(query.startDate.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid startDate format. Please use YYYY-MM-DD format.'
          });
          return;
        }
      }
      if (req.query.endDate && typeof req.query.endDate === 'string') {
        query.endDate = new Date(req.query.endDate);
        if (isNaN(query.endDate.getTime())) {
          res.status(400).json({
            success: false,
            message: 'Invalid endDate format. Please use YYYY-MM-DD format.'
          });
          return;
        }
      }

      // 验证日期范围
      if (query.startDate && query.endDate && query.startDate > query.endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate cannot be later than endDate.'
        });
        return;
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

  // GET /api/statistics/filters - 获取可用的筛选选项
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
