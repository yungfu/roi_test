import { Router } from 'express';
import { container } from 'tsyringe';
import { StatisticsController } from '../controllers/StatisticsController';

const router = Router();
const statisticsController = container.resolve(StatisticsController);

// GET /api/statistics - 获取统计数据
router.get('/', (req, res) => statisticsController.getStatistics(req, res));

// GET /api/statistics/filters - 获取可用的筛选选项
router.get('/filters', (req, res) => statisticsController.getFilterOptions(req, res));

export { router as statisticsRouter };
