// 筛选参数接口
export interface FilterParams {
    appName?: string;
    bidType?: string;
    country?: string;
}

// 查询参数接口（只保留查询相关参数）
export interface QueryParams extends FilterParams {
    // 移除分析相关参数，只保留查询相关参数
}

// ROI数据项接口
export interface ROIDataItem {
    day0?: { value: number; isReal0Roi: boolean };
    day1?: { value: number; isReal0Roi: boolean };
    day3?: { value: number; isReal0Roi: boolean };
    day7?: { value: number; isReal0Roi: boolean };
    day14?: { value: number; isReal0Roi: boolean };
    day30?: { value: number; isReal0Roi: boolean };
    day60?: { value: number; isReal0Roi: boolean };
    day90?: { value: number; isReal0Roi: boolean };
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
    private cacheTimeout = 1000;//60 * 5000; // 5分钟缓存时间

    /**
     * 生成缓存键（只基于查询参数）
     */
    private generateCacheKey(params: QueryParams): string {
        const queryString = new URLSearchParams();

        if (params.appName) queryString.set('appName', params.appName);
        if (params.bidType) queryString.set('bidType', params.bidType);
        if (params.country) queryString.set('country', params.country);

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
     * 主查询方法（只负责数据查询和缓存）
     */
    async query(params: QueryParams): Promise<QueryResponse> {
        const cacheKey = this.generateCacheKey(params);

        // 尝试从缓存获取
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
            console.log('Data loaded from cache');
            return cachedData;
        }

        // 从API获取数据
        console.log('Fetching data from API');
        const { appName, bidType, country } = params;
        const apiResponse = await this.fetchFromAPI({ appName, bidType, country });

        // 保存原始数据到缓存
        this.saveToCache(cacheKey, apiResponse);

        return apiResponse;
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
