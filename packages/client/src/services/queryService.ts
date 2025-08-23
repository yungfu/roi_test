// 筛选参数接口
export interface FilterParams {
  appName?: string;
  bidType?: string;
  country?: string;
}

// 查询参数接口
export interface QueryParams extends FilterParams {
  isLog?: boolean;
  isAverage?: boolean;
}

// ROI数据项接口
export interface ROIDataItem {
  day1?: { value: number; isReal0Roi: boolean };
  day3?: { value: number; isReal0Roi: boolean };
  day7?: { value: number; isReal0Roi: boolean };
  day14?: { value: number; isReal0Roi: boolean };
  day30?: { value: number; isReal0Roi: boolean };
}

// 统计结果项接口
export interface StatisticsResultItem {
  placementDate: string;
  appName: string;
  country: string;
  bidType: string;
  installCount: number;
  roi: ROIDataItem;
}

// 查询响应接口
export interface QueryResponse {
  success: boolean;
  message: string;
  data: {
    data: StatisticsResultItem[];
  };
}

// 缓存项接口
interface CacheItem {
  data: QueryResponse;
  timestamp: number;
  expiry: number;
}

class QueryService {
  private apiBaseUrl = '/api';
  private cacheTimeout = 60 * 1000; // 1分钟缓存时间

  /**
   * 生成缓存键
   */
  private generateCacheKey(params: QueryParams): string {
    const queryString = new URLSearchParams();
    
    if (params.appName) queryString.set('appName', params.appName);
    if (params.bidType) queryString.set('bidType', params.bidType);
    if (params.country) queryString.set('country', params.country);
    if (params.isLog) queryString.set('isLog', params.isLog.toString());
    if (params.isAverage) queryString.set('isAverage', params.isAverage.toString());
    
    return `query_cache_${queryString.toString()}`;
  }

  /**
   * 从localStorage获取缓存
   */
  private getFromCache(cacheKey: string): QueryResponse | null {
    try {
      const cacheData = localStorage.getItem(cacheKey);
      if (!cacheData) return null;

      const cacheItem: CacheItem = JSON.parse(cacheData);
      const now = Date.now();

      // 检查缓存是否过期
      if (now > cacheItem.expiry) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * 将数据保存到localStorage缓存
   */
  private saveToCache(cacheKey: string, data: QueryResponse): void {
    try {
      const now = Date.now();
      const cacheItem: CacheItem = {
        data,
        timestamp: now,
        expiry: now + this.cacheTimeout
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * 对数值转换为对数
   */
  private applyLogTransform(data: StatisticsResultItem[]): StatisticsResultItem[] {
    return data.map(item => ({
      ...item,
      installCount: Math.log10(Math.max(item.installCount, 1)), // 避免log(0)
      roi: {
        day1: item.roi.day1 ? {
          ...item.roi.day1,
          value: Math.log10(Math.max(item.roi.day1.value, 0.001)) // 避免log(0)
        } : undefined,
        day3: item.roi.day3 ? {
          ...item.roi.day3,
          value: Math.log10(Math.max(item.roi.day3.value, 0.001))
        } : undefined,
        day7: item.roi.day7 ? {
          ...item.roi.day7,
          value: Math.log10(Math.max(item.roi.day7.value, 0.001))
        } : undefined,
        day14: item.roi.day14 ? {
          ...item.roi.day14,
          value: Math.log10(Math.max(item.roi.day14.value, 0.001))
        } : undefined,
        day30: item.roi.day30 ? {
          ...item.roi.day30,
          value: Math.log10(Math.max(item.roi.day30.value, 0.001))
        } : undefined,
      }
    }));
  }

  /**
   * 计算平均值（当前日期和前两天的平均值）
   */
  private applyAverageTransform(data: StatisticsResultItem[]): StatisticsResultItem[] {
    // 按日期排序
    const sortedData = [...data].sort((a, b) => 
      new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
    );

    return sortedData.map((item, index) => {
      // 获取当前项和前两天的数据
      const currentIndex = index;
      const prevIndex1 = Math.max(0, index - 1);
      const prevIndex2 = Math.max(0, index - 2);
      
      const itemsToAverage = [
        sortedData[prevIndex2],
        sortedData[prevIndex1],
        sortedData[currentIndex]
      ].filter(Boolean);

      // 计算安装数的平均值
      const avgInstallCount = itemsToAverage.reduce((sum, item) => sum + item.installCount, 0) / itemsToAverage.length;

      // 计算ROI的平均值
      const avgRoi: ROIDataItem = {};
      
      (['day1', 'day3', 'day7', 'day14', 'day30'] as const).forEach(dayKey => {
        const values = itemsToAverage
          .map(item => item.roi[dayKey]?.value)
          .filter((value): value is number => value !== undefined);
        
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
   * 从API获取数据
   */
  private async fetchFromAPI(filterParams: FilterParams): Promise<QueryResponse> {
    const queryString = new URLSearchParams();
    
    if (filterParams.appName) queryString.set('appName', filterParams.appName);
    if (filterParams.bidType) queryString.set('bidType', filterParams.bidType);
    if (filterParams.country) queryString.set('country', filterParams.country);

    const url = `${this.apiBaseUrl}/satistics${queryString.toString() ? `?${queryString.toString()}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API query failed:', error);
      throw new Error('数据查询失败，请检查网络连接');
    }
  }

  /**
   * 主查询方法
   */
  async query(params: QueryParams): Promise<QueryResponse> {
    const cacheKey = this.generateCacheKey(params);
    
    // 尝试从缓存获取
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('Data loaded from cache');
      
      // 应用转换函数
      let processedData = cachedData.data.data;
      
      if (params.isLog) {
        processedData = this.applyLogTransform(processedData);
      }
      
      if (params.isAverage) {
        processedData = this.applyAverageTransform(processedData);
      }
      
      return {
        ...cachedData,
        data: {
          data: processedData
        }
      };
    }

    // 从API获取数据
    console.log('Fetching data from API');
    const { appName, bidType, country } = params;
    const apiResponse = await this.fetchFromAPI({ appName, bidType, country });
    
    // 保存原始数据到缓存
    this.saveToCache(cacheKey, apiResponse);
    
    // 应用转换函数
    let processedData = apiResponse.data.data;
    
    if (params.isLog) {
      processedData = this.applyLogTransform(processedData);
    }
    
    if (params.isAverage) {
      processedData = this.applyAverageTransform(processedData);
    }
    
    return {
      ...apiResponse,
      data: {
        data: processedData
      }
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('query_cache_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Query cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * 获取缓存信息
   */
  getCacheInfo(): { key: string; expiry: Date; size: number }[] {
    try {
      const keys = Object.keys(localStorage);
      const cacheInfo: { key: string; expiry: Date; size: number }[] = [];
      
      keys.forEach(key => {
        if (key.startsWith('query_cache_')) {
          const cacheData = localStorage.getItem(key);
          if (cacheData) {
            try {
              const cacheItem: CacheItem = JSON.parse(cacheData);
              cacheInfo.push({
                key: key.replace('query_cache_', ''),
                expiry: new Date(cacheItem.expiry),
                size: new Blob([cacheData]).size
              });
            } catch (e) {
              // 忽略解析错误的缓存项
            }
          }
        }
      });
      
      return cacheInfo;
    } catch (error) {
      console.error('Cache info error:', error);
      return [];
    }
  }
}

export const queryService = new QueryService();
