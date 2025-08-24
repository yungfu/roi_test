'use client'

import { Chart } from '@/components/Chart'
import { Filter } from '@/components/Filter'
import { QueryContext, QueryProvider } from '@/contexts/queryContext'
import { useContext, useEffect, useMemo, useState } from 'react'

function HomeContent() {
  const [mounted, setMounted] = useState(false)
  const { state, dispatch } = useContext(QueryContext)!;

  useEffect(() => {
    setMounted(true)
  }, [])

  const title = useMemo(() => {
    return `${state.app} - 多时间维度ROI趋势`;
  }, [state.app]);

  const subtitle = useMemo(() => {
    const dataModeText = state.dataMode === 'average' ? '7日移动平均' : '原始数据';
    const scaleText = state.yAxisMode === 'log' ? '对数刻度' : '线性刻度';
    return `(${dataModeText} - ${scaleText})`;
  }, [state.dataMode, state.yAxisMode]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {title}
        </h1>
        <div className="text-xl text-muted-foreground max-w-2xl mx-auto">
          <div>{subtitle}</div>
          <div>数据范围：最近90天</div>
        </div>
      </div>

      {/* Filter组件 */}
      <Filter />

      <Chart
        height={584}
        title="ROI Trend Analysis"
      />
    </div>
  )
}

export default function Home() {
  return (
    <QueryProvider>
      <HomeContent />
    </QueryProvider>
  )
}
