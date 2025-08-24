import csv from 'csv-parser';
import { Readable } from 'stream';
import { injectable } from 'tsyringe';
import { AppService } from './AppService';
import { CampaignService } from './CampaignService';
import { ROIDataService } from './ROIDataService';

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
  ) { }

  // 休眠函数，用于避免数据库连接频率限制
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

      // 批量处理，减少数据库连接频率
      const batchSize = 10;
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        
        for (const rowData of batch) {
          try {
            await this.importSingleRow(rowData, result.summary);
            result.successfulImports++;
          } catch (error) {
            result.errors.push(`Row ${i + 1} error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        // 每批次后短暂休眠，减少为50ms
        if (i + batchSize < parsedData.length) {
          await this.sleep(50);
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
      const allRows: CSVRow[] = [];
      const stream = Readable.from(fileBuffer);

      stream
        .pipe(csv())
        .on('data', (row: CSVRow) => {
          // 清理列名中的不可见字符
          const cleanedRow: CSVRow = {} as CSVRow;
          for (const [key, value] of Object.entries(row)) {
            const cleanedKey = key.replace(/^[\s\uFEFF\xA0\u200B-\u200D\u2060]+|[\s\uFEFF\xA0\u200B-\u200D\u2060]+$/g, '');
            (cleanedRow as any)[cleanedKey] = value;
          }
          allRows.push(cleanedRow);
        })
        .on('end', () => {
          try {
            // 找到CSV中的最大日期作为截至日期
            let maxDate: Date | undefined;
            for (const row of allRows) {
              // 解析日期 - 支持 "yyyy-MM-dd(weekday)" 格式
              const dateStr = row['日期'];
              const dateOnly = dateStr.includes('(') ? dateStr.split('(')[0] : dateStr;
              const rowDate = new Date(dateOnly);
              if (!isNaN(rowDate.getTime())) {
                if (!maxDate || rowDate > maxDate) {
                  maxDate = rowDate;
                }
              }
            }

            // 解析所有行
            for (const row of allRows) {
              const parsedRow = this.parseCSVRow(row, maxDate);
              results.push(parsedRow);
            }

            resolve(results);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error: Error) => {
          reject(error);
        });
    });
  }

  private parseCSVRow(row: CSVRow, maxDateInCSV?: Date): ParsedCampaignData {
    // 解析日期 - 支持 "yyyy-MM-dd(weekday)" 格式
    const dateStr = row['日期'];
    // 提取日期部分，去掉括号中的星期几
    const dateOnly = dateStr.includes('(') ? dateStr.split('(')[0] : dateStr;
    const placementDate = new Date(dateOnly);
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
          // 计算isReal0Roi：考虑投放日期和截至日期的间隔
          let isReal0Roi = false;
          if (roiValue === 0) {
            if (maxDateInCSV) {
              // 计算投放日期和截至日期的间隔天数
              const daysDifference = Math.floor((maxDateInCSV.getTime() - placementDate.getTime()) / (1000 * 60 * 60 * 24));
              // 对于当日ROI，只要有数据就是真实的
              if (roiField.days === 0) {
                isReal0Roi = true;
              } else {
                // 对于非当日ROI，判断间隔天数+1是否小于等于ROI周期
                // 例如：1日ROI需要间隔0天+1=1天 >= 1天，即投放当天和第二天都有数据
                isReal0Roi = (daysDifference + 1) >= roiField.days;
              }
            } else {
              // 如果没有提供最大日期，则按原逻辑处理
              isReal0Roi = true;
            }
          }

          roiData.push({
            daysPeriod: roiField.days,
            roiValue: roiValue,
            isReal0Roi: isReal0Roi
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
    await this.roiDataService.bulkInsertROIData(rowData.roiData.map(roi => ({
      campaignId: campaign.id,
      daysPeriod: roi.daysPeriod,
      roiValue: roi.roiValue,
      isReal0Roi: roi.isReal0Roi
    })));
    summary.roiDataCreated += rowData.roiData.length;
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

      // 获取实际列名并清理头尾的隐藏特殊字符
      const actualColumns = Object.keys(firstRow).map(col =>
        col.replace(/^[\s\uFEFF\xA0\u200B-\u200D\u2060]+|[\s\uFEFF\xA0\u200B-\u200D\u2060]+$/g, '')
      );

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
