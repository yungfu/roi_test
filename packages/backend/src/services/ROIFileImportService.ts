import { injectable } from 'tsyringe';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { AppService } from './AppService';
import { CampaignService } from './CampaignService';
import { ROIDataService } from './ROIDataService';
import { App } from '../entities/App';
import { Campaign } from '../entities/Campaign';
import { ROIData } from '../entities/ROIData';

interface CSVRow {
  '日期': string;
  'app': string;
  '出价类型': string;
  '国家地区': string;
  '应用安装.总次数': string;
  '当日ROI': string;
  '1日ROI': string;
  '3日ROI': string;
  '7日ROI': string;
  '14日ROI': string;
  '30日ROI': string;
  '60日ROI': string;
  '90日ROI': string;
}

interface ParsedCampaignData {
  placementDate: Date;
  appName: string;
  bidType: string;
  country: string;
  installCount: number;
  roiData: {
    daysPeriod: number;
    roiValue: number;
    isReal0Roi: boolean;
  }[];
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  errors: string[];
  summary: {
    appsCreated: number;
    campaignsCreated: number;
    roiDataCreated: number;
  };
}

@injectable()
export class ROIFileImportService {
  constructor(
    private appService: AppService,
    private campaignService: CampaignService,
    private roiDataService: ROIDataService
  ) {}

  async importFromCSV(fileBuffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      successfulImports: 0,
      errors: [],
      summary: {
        appsCreated: 0,
        campaignsCreated: 0,
        roiDataCreated: 0
      }
    };

    try {
      const parsedData = await this.parseCSV(fileBuffer);
      result.totalRows = parsedData.length;

      for (const rowData of parsedData) {
        try {
          await this.importSingleRow(rowData, result.summary);
          result.successfulImports++;
        } catch (error) {
          result.errors.push(`Row error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  private async parseCSV(fileBuffer: Buffer): Promise<ParsedCampaignData[]> {
    return new Promise((resolve, reject) => {
      const results: ParsedCampaignData[] = [];
      const stream = Readable.from(fileBuffer);

      stream
        .pipe(csv())
        .on('data', (row: CSVRow) => {
          try {
            const parsedRow = this.parseCSVRow(row);
            results.push(parsedRow);
          } catch (error) {
            reject(error);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error: Error) => {
          reject(error);
        });
    });
  }

  private parseCSVRow(row: CSVRow): ParsedCampaignData {
    // 解析日期
    const placementDate = new Date(row['日期']);
    if (isNaN(placementDate.getTime())) {
      throw new Error(`Invalid date format: ${row['日期']}`);
    }

    // 解析安装次数
    const installCount = parseInt(row['应用安装.总次数']);
    if (isNaN(installCount) || installCount < 0) {
      throw new Error(`Invalid install count: ${row['应用安装.总次数']}`);
    }

    // 解析ROI数据
    const roiData: ParsedCampaignData['roiData'] = [];
    const roiFields = [
      { field: '当日ROI', days: 0 },
      { field: '1日ROI', days: 1 },
      { field: '3日ROI', days: 3 },
      { field: '7日ROI', days: 7 },
      { field: '14日ROI', days: 14 },
      { field: '30日ROI', days: 30 },
      { field: '60日ROI', days: 60 },
      { field: '90日ROI', days: 90 }
    ];

    for (const roiField of roiFields) {
      const roiValueStr = row[roiField.field as keyof CSVRow];
      if (roiValueStr && roiValueStr.trim() !== '') {
        const roiValue = parseFloat(roiValueStr);
        if (!isNaN(roiValue)) {
          roiData.push({
            daysPeriod: roiField.days,
            roiValue: roiValue,
            isReal0Roi: roiValue === 0
          });
        }
      }
    }

    return {
      placementDate,
      appName: row['app'].trim(),
      bidType: row['出价类型'].trim(),
      country: row['国家地区'].trim(),
      installCount,
      roiData
    };
  }

  private async importSingleRow(
    rowData: ParsedCampaignData, 
    summary: ImportResult['summary']
  ): Promise<void> {
    // 1. 确保App存在，不存在则创建
    let app = await this.appService.getAppByName(rowData.appName);
    if (!app) {
      try {
        app = await this.appService.createApp({ name: rowData.appName });
        summary.appsCreated++;
      } catch (error) {
        // App might have been created by another concurrent request
        app = await this.appService.getAppByName(rowData.appName);
        if (!app) {
          throw new Error(`Failed to create or find app: ${rowData.appName}`);
        }
      }
    }

    // 2. 创建Campaign
    const campaign = await this.campaignService.createCampaign({
      placementDate: rowData.placementDate,
      bidType: rowData.bidType,
      installCount: rowData.installCount,
      country: rowData.country,
      appId: app.id
    });
    summary.campaignsCreated++;

    // 3. 创建ROI数据
    for (const roi of rowData.roiData) {
      await this.roiDataService.createROIData({
        campaignId: campaign.id,
        daysPeriod: roi.daysPeriod,
        roiValue: roi.roiValue,
        isReal0Roi: roi.isReal0Roi
      });
      summary.roiDataCreated++;
    }
  }

  async validateCSVFormat(fileBuffer: Buffer): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const stream = Readable.from(fileBuffer);
      const firstRow = await new Promise<any>((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (row: any) => {
            resolve(row);
          })
          .on('error', reject);
      });

      const requiredColumns = [
        '日期', 'app', '出价类型', '国家地区', '应用安装.总次数',
        '当日ROI', '1日ROI', '3日ROI', '7日ROI', '14日ROI', '30日ROI', '60日ROI', '90日ROI'
      ];

      const actualColumns = Object.keys(firstRow);
      
      for (const requiredCol of requiredColumns) {
        if (!actualColumns.includes(requiredCol)) {
          errors.push(`Missing required column: ${requiredCol}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`CSV format validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        errors
      };
    }
  }
}
