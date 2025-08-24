'use client'

import { debounce } from 'es-toolkit'
import { useContext, useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { QueryContext } from '../contexts/queryContext'
import { queryService, StatisticsResultItem } from '../services/queryService'

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
  { key: 'day0', name: '当日', color: '#8884d8' },
  { key: 'day1', name: '1日', color: '#82ca9d' },
  { key: 'day3', name: '3日', color: '#ffc658' },
  { key: 'day7', name: '7日', color: '#ff7300' },
  { key: 'day14', name: '14日', color: '#8dd1e1' },
  { key: 'day30', name: '30日', color: '#d084d0' },
  { key: 'day60', name: '60日', color: '#87d068' },
  { key: 'day90', name: '90日', color: '#ffc0cb' },
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
        if (roiValue && typeof roiValue.value === 'number'
          && (roiValue.value > 0 || roiValue.isReal0Roi)) {
          roiData[key] = roiValue.value;
        } else {
          console.log(`Missing or invalid ROI for ${key} on ${item.placementDate}:`, roiValue);
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
          // isLog: queryParams.yAxisMode === 'log',
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
      dataMode: state.dataMode,
    };

    debouncedQuery(queryParams);

    // 清理函数，取消防抖
    return () => {
      debouncedQuery.cancel();
    };
  }, [state.app, state.bidType, state.country, state.dataMode, debouncedQuery]);

  // Y轴配置 - 等间距刻度
  const yAxisProps = useMemo(() => {
    if (state.yAxisMode === 'log') {
      return {
        scale: 'log' as const,
        domain: ['dataMin', 'dataMax'],
        tickFormatter: (value: number) => `${value}%`,
      };
    }

    return {      
      tickFormatter: (value: number) => `${value}%`
    };
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
          <ReferenceLine 
            y={100} 
            strokeWidth={2}
            stroke="red" 
            label="100%回本线" 
          />
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
