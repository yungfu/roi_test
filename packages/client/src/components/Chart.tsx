'use client'

import { useContext, useEffect, useState, useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { QueryContext } from '../contexts/queryContext'
import { queryService, StatisticsResultItem } from '../services/queryService'
import { debounce } from 'es-toolkit'

// ROI数据接口
interface ROIData {
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

interface ChartProps {
  height?: number | string
  title?: string
}

// ROI Day的配置
const ROI_DAYS = [
  { key: 'day0', name: 'Day 0', color: '#8884d8' },
  { key: 'day1', name: 'Day 1', color: '#82ca9d' },
  { key: 'day3', name: 'Day 3', color: '#ffc658' },
  { key: 'day7', name: 'Day 7', color: '#ff7300' },
  { key: 'day14', name: 'Day 14', color: '#8dd1e1' },
  { key: 'day30', name: 'Day 30', color: '#d084d0' },
  { key: 'day60', name: 'Day 60', color: '#87d068' },
  { key: 'day90', name: 'Day 90', color: '#ffc0cb' },
] as const;

export function Chart({ 
  height = 400, 
  title = "ROI趋势分析"
}: ChartProps) {
  const { state } = useContext(QueryContext)!;
  const [chartData, setChartData] = useState<ROIData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 将查询结果转换为图表数据
  const transformData = (data: StatisticsResultItem[]): ROIData[] => {
    return data.map(item => {
      const roiData: ROIData = {
        placementDate: item.placementDate,
      };

      // 提取所有ROI日期数据
      ROI_DAYS.forEach(({ key }) => {
        const roiValue = item.roi[key];
        if (roiValue && typeof roiValue.value === 'number') {
          roiData[key] = roiValue.value;
        }
      });

      return roiData;
    });
  };

  // 创建防抖的查询函数
  const debouncedQuery = useMemo(
    () => debounce(async (queryParams: any) => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Executing query with params:', queryParams);
        const response = await queryService.query({
          appName: queryParams.app,
          bidType: queryParams.bidType,
          country: queryParams.country,
          isLog: queryParams.yAxisMode === 'log',
          isAverage: queryParams.dataMode === 'average',
        });

        if (response.success) {
          const transformedData = transformData(response.data.data);
          // 按日期排序
          transformedData.sort((a, b) => 
            new Date(a.placementDate).getTime() - new Date(b.placementDate).getTime()
          );
          setChartData(transformedData);
        } else {
          setError(response.message || '查询失败');
        }
      } catch (err) {
        console.error('Query error:', err);
        setError(err instanceof Error ? err.message : '查询出错');
      } finally {
        setIsLoading(false);
      }
    }, 500), // 500ms 防抖
    []
  );

  // 监听state变化并执行查询
  useEffect(() => {
    const queryParams = {
      app: state.app,
      bidType: state.bidType,
      country: state.country,
      yAxisMode: state.yAxisMode,
      dataMode: state.dataMode,
    };

    debouncedQuery(queryParams);

    // 清理函数，取消防抖
    return () => {
      debouncedQuery.cancel();
    };
  }, [state.app, state.bidType, state.country, state.yAxisMode, state.dataMode, debouncedQuery]);

  // Y轴配置 - 使用固定的非均匀刻度
  const yAxisProps = useMemo(() => {
    if (state.yAxisMode === 'log') {
      return {
        scale: 'log' as const,
        domain: ['dataMin', 'dataMax'],
      };
    }
    
    // 线性模式下，使用固定的刻度序列
    if (chartData.length > 0) {
      // 收集所有ROI值
      const allValues: number[] = [];
      chartData.forEach(item => {
        ROI_DAYS.forEach(({ key }) => {
          const value = item[key];
          if (typeof value === 'number' && !isNaN(value) && value >= 0) {
            allValues.push(value);
          }
        });
      });
      
      if (allValues.length > 0) {
        const minValue = Math.max(0, Math.min(...allValues));
        const maxValue = Math.max(...allValues);
        
        // 如果范围很小，使用默认配置
        if (maxValue - minValue < 0.0001) {
          return {};
        }
        
        // 使用固定的刻度序列
        const generateFixedTicks = (min: number, max: number): number[] => {
          // 固定的刻度序列：0, 7, 10, 20, 30, 50, 70, 100, 200, 300, 500
          const fixedTicksSequence = [0, 7, 10, 20, 30, 50, 70, 100, 200, 300, 500];
          
          // 只保留小于等于最大值的刻度，稍微留点余量
          const validTicks = fixedTicksSequence.filter(tick => tick <= max * 1.1);
          
          // 确保至少有0和一个大于0的刻度
          if (validTicks.length === 1) { // 只有0
            const nextTick = fixedTicksSequence.find(tick => tick > max);
            if (nextTick) validTicks.push(nextTick);
          }
          
          return validTicks;
        };
        
        const ticks = generateFixedTicks(minValue, maxValue);
        const domainMax = Math.max(maxValue * 1.05, ticks[ticks.length - 1]);
        
        // 调试信息
        console.log('Generated fixed ticks:', ticks, 'Max value:', maxValue);
        
        return {
          type: 'number' as const,
          domain: [0, domainMax],
          ticks: ticks,
          allowDataOverflow: false,
          interval: 0,
        };
      }
    }
    
    return {};
  }, [state.yAxisMode, chartData]);

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{`日期: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toFixed(4) : 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">❌ 查询失败</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {isLoading && (
          <div className="flex items-center text-blue-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-sm">加载中...</span>
          </div>
        )}
      </div>
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="placementDate" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis {...yAxisProps} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* 渲染所有ROI天数的线条 */}
            {ROI_DAYS.map(({ key, name, color }) => (
              <Line 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={color} 
                strokeWidth={2}
                name={name}
                connectNulls={false}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {chartData.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">暂无数据</div>
        </div>
      )}
    </div>
  )
}
