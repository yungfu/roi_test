import { ROIDataItem, StatisticsResultItem } from './queryService';

// 分析参数接口
export interface AnalyzeParams {
    dataMode: 'raw' | 'average';
    doPrediction?: boolean;
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
    day0Predicted?: number; 
    day1Predicted?: number; 
    day3Predicted?: number; 
    day7Predicted?: number; 
    day14Predicted?: number; 
    day30Predicted?: number; 
    day60Predicted?: number; 
    day90Predicted?: number; 
}

type SingleROI = Pick<AnalyzedROIData, 'placementDate'> & {
    value: number | undefined;
    isPredicted?: boolean;
};

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

        if(params.doPrediction) {
            return this.doPrediction(analyzedData);
        }

        return analyzedData;
    }

private doPrediction(data: AnalyzedROIData[]): AnalyzedROIData[] {
        // ROI类型数组
        const days = ['day0', 'day1', 'day3', 'day7', 'day14', 'day30', 'day60', 'day90'] as const;
        
        // 为每个ROI类型进行预测
        const predictedResults: { [key: string]: SingleROI[] } = {};
        
        days.forEach(dayKey => {
            // 提取包含当前ROI类型数据的项
            const singleROIData: SingleROI[] = data
                .filter(item => item[dayKey] !== undefined)
                .map(item => ({
                    placementDate: item.placementDate,
                    value: item[dayKey],
                    isPredicted: false
                }));                       

            if (singleROIData.length > 0) {
                // 对单个ROI类型进行预测
                predictedResults[dayKey] = this.doPredictionOnSingleROI(singleROIData);
            }
        });
        
        // 合并预测结果
        const mergedData: AnalyzedROIData[] = [];
        
        // 创建一个包含所有日期的映射
        const dateMap = new Map<string, AnalyzedROIData>();
        
        // 初始化所有原始数据
        data.forEach(item => {
            dateMap.set(item.placementDate, { ...item });
        });
        
        // 合并预测数据
        days.forEach(dayKey => {
            if (predictedResults[dayKey]) {
                predictedResults[dayKey].forEach(predictedItem => {
                    const existingItem = dateMap.get(predictedItem.placementDate);
                    if (existingItem) {
                        // 更新现有项
                        if (predictedItem.isPredicted) {
                            // 如果是预测值，写入到对应的预测字段
                            const predictionKey = `${dayKey}Predicted` as keyof AnalyzedROIData;
                            (existingItem as any)[predictionKey] = predictedItem.value;
                        } else {
                            // 如果是原始值，写入到原始字段
                            existingItem[dayKey] = predictedItem.value;
                        }
                    } else {
                        // 创建新项（预测的新日期）
                        const newItem: AnalyzedROIData = {
                            placementDate: predictedItem.placementDate,
                        };
                        if (predictedItem.isPredicted) {
                            // 预测值写入预测字段
                            const predictionKey = `${dayKey}Predicted`;
                            (newItem as any)[predictionKey] = predictedItem.value;
                        } else {
                            // 原始值写入原始字段
                            newItem[dayKey] = predictedItem.value;
                        }
                        dateMap.set(predictedItem.placementDate, newItem);
                    }
                });
            }
        });
        
        // 转换为数组并排序
        const result = Array.from(dateMap.values());
        result.sort((a, b) => new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime());
        
        return result;
    }

    private doPredictionOnSingleROI(data: SingleROI[]): SingleROI[] {
        if (data.length < 2) {
            // 数据点不足，无法进行线性回归
            return data;
        }

        // 按日期排序
        const sortedData = [...data].sort((a, b) => 
            new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
        );

        // 计算线性回归参数
        const n = sortedData.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

        sortedData.forEach((item, index) => {
            const x = index; // 使用索引作为x值
            const y = item.value || 0;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });

        // 计算斜率和截距
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // 生成预测结果
        const result: SingleROI[] = [...sortedData];
        
        // 获取最后一个数据点的日期
        const lastDate = new Date(sortedData[sortedData.length - 1].placementDate);
        
        // 获取原始数据的最大值，用于限制预测值
        const maxOriginalValue = Math.max(...sortedData.map(item => item.value || 0));
        const maxAllowedPrediction = maxOriginalValue * 1.2; // 预测值不超过原始值的20%

        // 向后预测一定天数（比如30天）
        const predictionDays = 6;
        
        for (let i = 1; i <= predictionDays; i++) {
            const futureDate = new Date(lastDate);
            futureDate.setDate(lastDate.getDate() + i);
            const dateString = futureDate.toISOString().split('T')[0];
            
            // 计算预测索引（在原有数据基础上继续）
            const predictionIndex = sortedData.length - 1 + i;
            
            // 使用线性回归公式预测值
            let predictedValue = slope * predictionIndex + intercept;
            
            // 限制预测值不超过原始值的20%
            if (predictedValue > maxAllowedPrediction) {
                predictedValue = maxAllowedPrediction;
            }
            
            // 确保预测值不为负数
            if (predictedValue < 0) {
                predictedValue = 0;
            }

            // 添加预测数据点
            result.push({
                placementDate: dateString,
                value: predictedValue,
                isPredicted: true
            });
        }

        // 返回结果（已经按日期排序）
        return result;
    }


}

export const analyzeService = new AnalyzeService();
