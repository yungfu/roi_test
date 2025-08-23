import { Router } from 'express';
import { container } from 'tsyringe';
import { ROIFilesController } from '../controllers/ROIFilesController';

const router = Router();
const roiFilesController = container.resolve(ROIFilesController);

// GET /api/roifiles/template - 下载CSV模板
router.get('/template', (req, res) => roiFilesController.downloadTemplate(req, res));

// GET /api/roifiles/import/status - 获取导入状态
router.get('/import/status', (req, res) => roiFilesController.getImportStatus(req, res));

// POST /api/roifiles/validate - 验证CSV文件格式
router.post('/validate', 
  roiFilesController.getUploadMiddleware(),
  (req, res) => roiFilesController.validateFile(req, res)
);

// POST /api/roifiles/import - 导入ROI数据文件
router.post('/import',
  roiFilesController.getUploadMiddleware(),
  (req, res) => roiFilesController.importFile(req, res)
);

export { router as roiFilesRouter };
