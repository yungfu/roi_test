import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import multer from 'multer';
import { ROIFileImportService } from '../services/ROIFileImportService';

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

@injectable()
export class ROIFilesController {
  constructor(private roiFileImportService: ROIFileImportService) {}

  // 获取文件上传的中间件
  getUploadMiddleware() {
    return upload.single('file');
  }

  // POST /api/roifiles/import - 导入ROI数据文件
  async importFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided. Please upload a CSV file.'
        });
        return;
      }

      // 验证CSV格式
      const validation = await this.roiFileImportService.validateCSVFormat(req.file.buffer);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: 'Invalid CSV format',
          errors: validation.errors
        });
        return;
      }

      // 执行导入
      const result = await this.roiFileImportService.importFromCSV(req.file.buffer);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'File imported successfully',
          data: result
        });
      } else {
        res.status(207).json({ // 207 Multi-Status - partial success
          success: false,
          message: 'File imported with errors',
          data: result
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during import',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/roifiles/validate - 验证CSV文件格式（不执行导入）
  async validateFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file provided. Please upload a CSV file.'
        });
        return;
      }

      const validation = await this.roiFileImportService.validateCSVFormat(req.file.buffer);

      res.status(200).json({
        success: validation.valid,
        message: validation.valid ? 'CSV format is valid' : 'CSV format is invalid',
        errors: validation.errors
      });
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/roifiles/template - 下载CSV模板文件
  async downloadTemplate(req: Request, res: Response): Promise<void> {
    try {
      const csvTemplate = [
        '日期,app,出价类型,国家地区,应用安装.总次数,当日ROI,1日ROI,3日ROI,7日ROI,14日ROI,30日ROI,60日ROI,90日ROI',
        '2024-01-01,TestApp,CPI,US,100,0.5,0.8,1.2,1.5,1.8,2.0,2.2,2.5',
        '2024-01-02,TestApp,CPI,CN,150,0.6,0.9,1.3,1.6,1.9,2.1,2.3,2.6'
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="roi_data_template.csv"');
      res.status(200).send(csvTemplate);
    } catch (error) {
      console.error('Template download error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during template download',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
