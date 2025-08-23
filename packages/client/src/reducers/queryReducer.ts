// 定义状态类型
export interface QueryState {
  installChannel: string; // 安装渠道
  bidType: string; // 出价类型
  country: string; // 国家
  app: string; // 应用
  dataMode: 'raw' | 'average'; // 数据模式
  yAxisMode: 'linear' | 'log'; // Y轴模式
}

// 定义Action类型
export type QueryAction =
  | { type: 'SET_INSTALL_CHANNEL'; payload: string }
  | { type: 'SET_BID_TYPE'; payload: string }
  | { type: 'SET_COUNTRY'; payload: string }
  | { type: 'SET_APP'; payload: string }
  | { type: 'SET_DATA_MODE'; payload: QueryState['dataMode'] }
  | { type: 'SET_Y_AXIS_MODE'; payload: QueryState['yAxisMode'] }
  | { type: 'RESET_ALL' }
  | { type: 'SET_MULTIPLE'; payload: Partial<QueryState> }

// 初始状态
export const initialQueryState: QueryState = {
  installChannel: 'Apple',
  bidType: 'CPI',
  country: '美国',
  app: 'App-1',
  dataMode: 'raw',
  yAxisMode: 'linear',
}

// Reducer函数
export const queryReducer = (state: QueryState, action: QueryAction): QueryState => {
  console.log('Dispatching action:', action);
  switch (action.type) {
    case 'SET_INSTALL_CHANNEL':
      return {
        ...state,
        installChannel: action.payload,
      }
    case 'SET_BID_TYPE':
      return {
        ...state,
        bidType: action.payload,
      }
    case 'SET_COUNTRY':
      return {
        ...state,
        country: action.payload,
      }
    case 'SET_APP':
      return {
        ...state,
        app: action.payload,
      }
    case 'SET_DATA_MODE':
      return {
        ...state,
        dataMode: action.payload,
      }
    case 'SET_Y_AXIS_MODE':
      return {
        ...state,
        yAxisMode: action.payload,
      }
    case 'SET_MULTIPLE':
      return {
        ...state,
        ...action.payload,
      }
    case 'RESET_ALL':
      return initialQueryState
    default:
      return state
  }
}
