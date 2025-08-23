'use client'

import {
  initialQueryState,
  QueryAction,
  queryReducer,
  QueryState
} from '@/reducers/queryReducer'
import React, { createContext, ReactNode, useContext, useReducer } from 'react'

// Context类型定义
interface QueryContextType {
  state: QueryState
  dispatch: React.Dispatch<QueryAction>
  // 便捷的action creators
  setInstallChannel: (channel: string) => void
  setBidType: (bidType: string) => void
  setCountry: (country: string) => void
  setApp: (app: string) => void
  setDataMode: (mode: QueryState['dataMode']) => void
  setYAxisMode: (mode: QueryState['yAxisMode']) => void
  resetAll: () => void
  setMultiple: (updates: Partial<QueryState>) => void
}

// 创建Context
const QueryContext = createContext<QueryContextType | undefined>(undefined)

// Provider组件
interface QueryProviderProps {
  children: ReactNode
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(queryReducer, initialQueryState)

  // 便捷的action creators
  const setInstallChannel = (channel: string) => {
    dispatch({ type: 'SET_INSTALL_CHANNEL', payload: channel })
  }

  const setBidType = (bidType: string) => {
    dispatch({ type: 'SET_BID_TYPE', payload: bidType })
  }

  const setCountry = (country: string) => {
    dispatch({ type: 'SET_COUNTRY', payload: country })
  }

  const setApp = (app: string) => {
    dispatch({ type: 'SET_APP', payload: app })
  }

  const setDataMode = (mode: QueryState['dataMode']) => {
    dispatch({ type: 'SET_DATA_MODE', payload: mode })
  }

  const setYAxisMode = (mode: QueryState['yAxisMode']) => {
    dispatch({ type: 'SET_Y_AXIS_MODE', payload: mode })
  }

  const resetAll = () => {
    dispatch({ type: 'RESET_ALL' })
  }

  const setMultiple = (updates: Partial<QueryState>) => {
    dispatch({ type: 'SET_MULTIPLE', payload: updates })
  }

  const value: QueryContextType = {
    state,
    dispatch,
    setInstallChannel,
    setBidType,
    setCountry,
    setApp,
    setDataMode,
    setYAxisMode,
    resetAll,
    setMultiple,
  }

  return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>
}

// Hook for using the context
export const useQuery = () => {
  const context = useContext(QueryContext)
  if (context === undefined) {
    throw new Error('useQuery must be used within a QueryProvider')
  }
  return context
}

// 导出便捷的选择器hooks
export const useQueryState = () => {
  const { state } = useQuery()
  return state
}

export const useQueryActions = () => {
  const {
    setInstallChannel,
    setBidType,
    setCountry,
    setApp,
    setDataMode,
    setYAxisMode,
    resetAll,
    setMultiple,
  } = useQuery()
  
  return {
    setInstallChannel,
    setBidType,
    setCountry,
    setApp,
    setDataMode,
    setYAxisMode,
    resetAll,
    setMultiple,
  }
}

// 特定字段的选择器hooks
export const useInstallChannel = () => {
  const { state, setInstallChannel } = useQuery();
  return [state.installChannel, setInstallChannel] as const;
}

export const useBidType = () => {
  const { state, setBidType } = useQuery();
  return [state.bidType, setBidType] as const;
}

export const useCountry = () => {
  const { state, setCountry } = useQuery();
  return [state.country, setCountry] as const;
}

export const useApp = () => {
  const { state, setApp } = useQuery();
  return [state.app, setApp] as const;
}

export const useDataMode = () => {
  const { state, setDataMode } = useQuery();
  return [state.dataMode, setDataMode] as const;
}

export const useYAxisMode = () => {
  const { state, setYAxisMode } = useQuery();
  return [state.yAxisMode, setYAxisMode] as const;
}

// 重新导出类型以便其他文件使用
export type { QueryAction, QueryState } from '@/reducers/queryReducer'

