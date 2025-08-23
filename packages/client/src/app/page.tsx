'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Sample data for the chart
const data = [
  { name: 'Jan', roi: 4.2, investment: 2400, returns: 2800 },
  { name: 'Feb', roi: 3.8, investment: 1398, returns: 1532 },
  { name: 'Mar', roi: 5.1, investment: 9800, returns: 10298 },
  { name: 'Apr', roi: 4.7, investment: 3908, returns: 4092 },
  { name: 'May', roi: 6.2, investment: 4800, returns: 5098 },
  { name: 'Jun', roi: 5.8, investment: 3800, returns: 4020 },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to ROI Analyze
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Analyze your return on investment with powerful insights and interactive charts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Investment</h3>
          <p className="text-3xl font-bold text-blue-600">$24,108</p>
          <p className="text-sm text-gray-500 mt-1">+12% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Returns</h3>
          <p className="text-3xl font-bold text-green-600">$25,840</p>
          <p className="text-sm text-gray-500 mt-1">+8% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average ROI</h3>
          <p className="text-3xl font-bold text-purple-600">4.97%</p>
          <p className="text-sm text-gray-500 mt-1">+0.3% from last month</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ROI Trend Analysis</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="roi" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="ROI (%)"
              />
              <Line 
                type="monotone" 
                dataKey="investment" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Investment ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
