'use client'

import {
    useApp,
    useBidType,
    useCountry,
    useDataMode,
    useInstallChannel,
    useYAxisMode
} from '@/contexts/queryContext'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import React from 'react'

// 筛选器选项配置
const filterOptions = {
  installChannels: [
    { value: 'Apple', label: 'Apple' },
  ],
  bidTypes: [
    { value: 'CPI', label: 'CPI' },
  ],
  countries: [
    { value: '美国', label: '美国' },
    { value: '英国', label: '英国' }
  ],
  apps: [
    { value: 'App-1', label: 'App-1' },
    { value: 'App-2', label: 'App-2' },
    { value: 'App-3', label: 'App-3' },
    { value: 'App-4', label: 'App-4' },
    { value: 'App-5', label: 'App-5' },
  ]
}

// shadcn Select包装组件
interface SelectWithLabelProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}

const SelectWithLabel: React.FC<SelectWithLabelProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  disabled = false 
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={disabled ? 'bg-gray-100 text-gray-500' : ''}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// shadcn RadioGroup包装组件
interface RadioGroupWithLabelProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

const RadioGroupWithLabel: React.FC<RadioGroupWithLabelProps> = ({ 
  label, 
  value, 
  onChange, 
  options 
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <RadioGroup value={value} onValueChange={onChange} className="flex space-x-4">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={option.value} />
            <label 
              htmlFor={option.value}
              className="text-sm text-gray-700 cursor-pointer"
            >
              {option.label}
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

// 主Filter组件
export const Filter: React.FC = () => {
  const [installChannel, setInstallChannel] = useInstallChannel()
  const [bidType, setBidType] = useBidType()
  const [country, setCountry] = useCountry()
  const [app, setApp] = useApp()
  const [dataMode, setDataMode] = useDataMode()
  const [yAxisMode, setYAxisMode] = useYAxisMode()

  return (
    <div className="bg-white rounded-lg shadow-md border p-6 space-y-6">
      {/* 第一行：筛选器 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SelectWithLabel
          label="用户安装渠道"
          value={installChannel}
          onChange={setInstallChannel}
          options={filterOptions.installChannels}
          disabled={true}
        />
        
        <SelectWithLabel
          label="出价类型"
          value={bidType}
          onChange={setBidType}
          options={filterOptions.bidTypes}
          disabled={true}
        />
        
        <SelectWithLabel
          label="国家地区"
          value={country}
          onChange={setCountry}
          options={filterOptions.countries}
        />
        
        <SelectWithLabel
          label="APP"
          value={app}
          onChange={setApp}
          options={filterOptions.apps}
        />
      </div>

      {/* 第二行：控制器 */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className='bg-gray-50 p-4 rounded-md'>
            <RadioGroupWithLabel
              label="数据显示模式"
              value={dataMode}
              onChange={(value) => setDataMode(value as 'raw' | 'average')}
              options={[
                { value: 'average', label: '显示移动平均值' },
                { value: 'raw', label: '显示原始数据' },
              ]}
            />
          </div>
          
          <div className='bg-gray-50 p-4 rounded-md'>
            <RadioGroupWithLabel
              label="Y轴刻度"
              value={yAxisMode}
              onChange={(value) => setYAxisMode(value as 'linear' | 'log')}
              options={[
                { value: 'linear', label: '线性刻度' },
                { value: 'log', label: '对数刻度' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Filter;
