import { StatisticsResultItem, ROIDataItem } from './queryService';

// 分析参数接口
export interface AnalyzeParams {
    dataMode: 'raw' | 'average';
}

// 分析后的ROI数据接口
export interface AnalyzedROIData {
    placementDate: string;
    day0?: number;
    day1?: number;
    day3?: number;
    day7?: number;
    day14?: number;
    day30?: number;
    day60?: number;
    day90?: number;
}

class AnalyzeService {
    /**
     * 过滤掉值为0且不是真实0ROI的数据
     */
    private filterInvalidROI(roiValue: { value: number; isReal0Roi: boolean } | undefined): number | undefined {
        if (!roiValue) return undefined;
        
        // 如果值大于0，或者值为0且是真实0ROI，则保留
        if (roiValue.value > 0 || roiValue.isReal0Roi) {
            return roiValue.value;
        }
        
        // 否则过滤掉
        return undefined;
    }

    /**
     * 将统计结果转换为分析数据格式
     */
    private transformToAnalyzedData(data: StatisticsResultItem[]): AnalyzedROIData[] {
        return data.map(item => {
            const analyzedData: AnalyzedROIData = {
                placementDate: item.placementDate,
            };

            // 处理所有ROI天数，过滤无效数据
            const roiDays = ['day0', 'day1', 'day3', 'day7', 'day14', 'day30', 'day60', 'day90'] as const;
            roiDays.forEach(dayKey => {
                const filteredValue = this.filterInvalidROI(item.roi[dayKey]);
                if (filteredValue !== undefined) {
                    analyzedData[dayKey] = filteredValue;
                }
            });

            return analyzedData;
        });
    }

    /**
     * 计算7日移动平均值
     */
    private calculateMovingAverage(data: StatisticsResultItem[]): StatisticsResultItem[] {
        // 按日期排序
        const sortedData = [...data].sort((a, b) =>
            new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
        );

        return sortedData.map((item, index) => {
            // 获取当前项和前6天的数据（总共7天）
            const itemsToAverage = [sortedData[index]];
            const windowSize = 7;
            
            for (let j = 1; j < windowSize && (index - j) >= 0; j++) {
                itemsToAverage.push(sortedData[index - j]);
            }

            // 计算安装数的平均值
            const avgInstallCount = itemsToAverage.reduce((sum, item) => sum + item.installCount, 0) / itemsToAverage.length;

            // 计算ROI的平均值
            const avgRoi: ROIDataItem = {};

            (['day0', 'day1', 'day3', 'day7', 'day14', 'day30', 'day60', 'day90'] as const).forEach(dayKey => {
                const values = itemsToAverage
                    .map(item => item.roi[dayKey])
                    .filter((roiValue): roiValue is { value: number; isReal0Roi: boolean } => 
                        roiValue !== undefined && 
                        (roiValue.value > 0 || roiValue.isReal0Roi === true)
                    )
                    .map(roiValue => roiValue.value);

                if (values.length > 0) {
                    const avgValue = values.reduce((sum, value) => sum + value, 0) / values.length;
                    const originalItem = item.roi[dayKey];

                    avgRoi[dayKey] = {
                        value: avgValue,
                        isReal0Roi: originalItem?.isReal0Roi || false
                    };
                }
            });

            return {
                ...item,
                installCount: avgInstallCount,
                roi: avgRoi
            };
        });
    }

    /**
     * 主要分析方法
     */
    analyze(data: StatisticsResultItem[], params: AnalyzeParams): AnalyzedROIData[] {
        let processedData = data;

        // 如果是平均模式，先计算移动平均
        if (params.dataMode === 'average') {
            processedData = this.calculateMovingAverage(data);
        }

        // 转换为分析数据格式并过滤无效ROI
        const analyzedData = this.transformToAnalyzedData(processedData);

        // 按日期排序
        analyzedData.sort((a, b) =>
            new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
        );

        return analyzedData;
    }
}

export const analyzeService = new AnalyzeService();
