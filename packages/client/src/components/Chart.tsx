'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'

export type ChartType = 'line' | 'bar' | 'area'

interface ChartData {
  [key: string]: string | number
}

interface ChartProps {
  data: ChartData[]
  type?: ChartType
  height?: number | string
  lines?: Array<{
    dataKey: string
    stroke: string
    name: string
    strokeWidth?: number
  }>
  bars?: Array<{
    dataKey: string
    fill: string
    name: string
  }>
  areas?: Array<{
    dataKey: string
    stroke: string
    fill: string
    name: string
  }>
  xAxisKey?: string
  title?: string
}

export function Chart({ 
  data, 
  type = 'line', 
  height = 400, 
  lines = [], 
  bars = [],
  areas = [],
  xAxisKey = 'name',
  title 
}: ChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {bars.map((bar) => (
              <Bar 
                key={bar.dataKey}
                dataKey={bar.dataKey} 
                fill={bar.fill}
                name={bar.name}
              />
            ))}
          </BarChart>
        )
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {areas.map((area) => (
              <Area 
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey} 
                stroke={area.stroke}
                fill={area.fill}
                name={area.name}
              />
            ))}
          </AreaChart>
        )
      
      case 'line':
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {lines.map((line) => (
              <Line 
                key={line.dataKey}
                type="monotone" 
                dataKey={line.dataKey} 
                stroke={line.stroke} 
                strokeWidth={line.strokeWidth || 2}
                name={line.name}
              />
            ))}
          </LineChart>
        )
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
