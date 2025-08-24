'use client'

import { debounce } from 'es-toolkit'
import { useContext, useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { QueryContext } from '../contexts/queryContext'
import { analyzeService } from '../services/analyzeService'
import { queryService, StatisticsResultItem } from '../services/queryService'

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

const PREIDCTION_DAYS = [
  { key: 'day0Predicted', name: '当日ROI预测', color: '#8884d8' },
  { key: 'day1Predicted', name: '1日ROI预测', color: '#82ca9d' },
  { key: 'day3Predicted', name: '3日ROI预测', color: '#ffc658' },
  { key: 'day7Predicted', name: '7日ROI预测', color: '#ff7300' },
  { key: 'day14Predicted', name: '14日ROI预测', color: '#8dd1e1' },
  { key: 'day30Predicted', name: '30日ROI预测', color: '#d084d0' },
  { key: 'day60Predicted', name: '60日ROI预测', color: '#87d068' },
  { key: 'day90Predicted', name: '90日ROI预测', color: '#ffc0cb' },
] as const;

export function Chart({
  height = 400,
  title = "ROI趋势分析"
}: ChartProps) {
  const { state } = useContext(QueryContext)!;
  
  // 分离查询数据和图表数据
  const [queryData, setQueryData] = useState<StatisticsResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 新增状态：记录每条线的显示/隐藏状态
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const [doPrediction, setDoPrediction] = useState(false);

  // 创建防抖的查询函数（只负责数据查询）
  const debouncedQuery = useMemo(
    () => debounce(async (queryParams: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await queryService.query({
          appName: queryParams.app,
          bidType: queryParams.bidType,
          country: queryParams.country,
        });

        if (response.success) {
          setQueryData(response.data.data);
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

  // 监听查询相关的state变化并执行查询
  useEffect(() => {
    const queryParams = {
      app: state.app,
      bidType: state.bidType,
      country: state.country,
    };

    debouncedQuery(queryParams);

    // 清理函数，取消防抖
    return () => {
      debouncedQuery.cancel();
    };
  }, [state.app, state.bidType, state.country, debouncedQuery]);

  // 使用useMemo计算chartData
  const chartData = useMemo(() => {
    if (queryData.length === 0) {
      return [];
    }

    try {
      const analyzedData = analyzeService.analyze(queryData, {
        dataMode: state.dataMode === 'average' ? 'average' : 'raw',
        doPrediction: doPrediction
      });
      console.log(doPrediction);
      console.log('Analyzed data:', analyzedData);
      return analyzedData;
    } catch (err) {
      console.error('Analysis error:', err);
      setError('数据分析出错');
      return [];
    }
  }, [queryData, state.dataMode, doPrediction]);

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
  }, [state.yAxisMode]);

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground p-3 border border-border rounded shadow-lg">
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

  // 处理Legend点击事件
  const handleLegendClick = (dataKey: string) => {
    setHiddenLines(prev => {
      const newHiddenLines = new Set(prev);
      if (newHiddenLines.has(dataKey)) {
        newHiddenLines.delete(dataKey);
      } else {
        newHiddenLines.add(dataKey);
      }
      return newHiddenLines;
    });
  };

  // 自定义Legend渲染
  const CustomLegend = (props: any) => {    
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {ROI_DAYS.map((entry: any, index: number) => {
          const isHidden = hiddenLines.has(entry.key);
          // 根据dataMode动态生成Label文字
          const labelText = state.dataMode === "average" 
            ? `${entry.name}(7日移动平均)` 
            : entry.name;
          
          return (
            <div
              key={`legend-${index}`}
              className="flex items-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded"
              onClick={() => handleLegendClick(entry.key)}
            >
              <div
                className="w-3 h-3 mr-2"
                style={{
                  backgroundColor: isHidden ? "#cccccc" : entry.color,
                  borderRadius: "2px"
                }}
              />
              <span
                className={`text-sm ${isHidden ? "text-muted-foreground" : "text-foreground"}`}
              >
                {labelText}
              </span>
            </div>
          );
        })}
        
        {/* 预测开关Legend */}
        <div
          className="flex items-center cursor-pointer select-none hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded border border-border"
          onClick={() => setDoPrediction(!doPrediction)}
        >
          <div
            className="w-3 h-3 mr-2 border"
            style={{
              backgroundColor: doPrediction ? "#4CAF50" : "transparent",
              borderColor: "#4CAF50",
              borderRadius: "2px",
              borderWidth: "2px"
            }}
          />
          <span className={`text-sm font-medium ${doPrediction ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
            预测线条 {doPrediction ? "(已开启)" : "(已关闭)"}
          </span>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-destructive text-lg mb-2">❌ 查询失败</div>
            <div className="text-muted-foreground">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {isLoading && (
          <div className="flex items-center text-primary">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
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
            <Legend content={<CustomLegend />} />

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
                hide={hiddenLines.has(key)}
              />
            ))}
            {doPrediction && PREIDCTION_DAYS.map(({ key, name, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                name={name}
                connectNulls={false}
                dot={{ r: 3 }} // 粗点
                activeDot={{ r: 7 }} // 鼠标悬停时更大
                strokeDasharray="6 8" // 虚线：6px实线，8px间隔，点更粗
                hide={hiddenLines.has(key)}
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
          <div className="text-muted-foreground">暂无数据</div>
        </div>
      )}
    </div>
  )
}
