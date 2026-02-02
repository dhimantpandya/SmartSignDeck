import { GenericResponse } from './generic'

interface AnalyticsCardData {
  value: string
  percentageChange: string
}

interface AnalyticsData {
  totalRevenue: AnalyticsCardData
  subscriptions: AnalyticsCardData
  sales: AnalyticsCardData
  activeNow: AnalyticsCardData
}

export interface AnalyticDataResponse extends GenericResponse<AnalyticsData> {}
