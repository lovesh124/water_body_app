import axios from 'axios';
import { SamplingStation, WaterQualityData } from '../types';

// Use relative URL in development (proxied via Vite)
// In production, this should be the full API URL
const BASE_URL = import.meta.env.DEV ? '' : 'https://dev.api.wateratlas.org';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
});

export const getSamplingLocations = async (waterBodyId: string): Promise<SamplingStation[]> => {
  try {
    console.log('API call: getSamplingLocations for waterBodyId:', waterBodyId);
    
    // Only fetch a few stations - we just need some station IDs for data queries
    const response = await api.get(`/api/sampling-locations`, {
      params: { 
        waterBodyId,
        pageNumber: 1,
        pageSize: 10
      }
    });
    
    if (response.data && response.data.items) {
      console.log(`Got ${response.data.items.length} stations (of ${response.data.totalCount} total)`);
      return response.data.items;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching sampling locations:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
    }
    return [];
  }
};

export const getSamplingData = async (
  stationIds: string[],
  parameter: string,
  startDate?: string,
  endDate?: string
): Promise<WaterQualityData[]> => {
  try {
    // Deduplicate and limit station IDs to avoid URL-too-long errors
    const uniqueStationIds = [...new Set(stationIds)];
    const limitedStationIds = uniqueStationIds.slice(0, 5);
    console.log(`Fetching ${parameter}, using ${limitedStationIds.length} of ${uniqueStationIds.length} unique stations`);
    
    // Only fetch 1 page with few results - we just need the latest value
    const response = await api.get(`/api/samplingdata`, {
      params: {
        stationIds: limitedStationIds.join(','),
        parameter,
        pageSize: 10,
        pageNumber: 1,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }
    });
    
    // Handle paginated response with items array
    if (response.data && response.data.items) {
      const items = response.data.items;
      console.log(`Got ${items.length} data points for ${parameter}`);
      
      // Map API fields to our expected format
      return items.map((item: any) => ({
        stationId: item.stationID || item.stationId,
        parameter: item.parameter || parameter,
        // Use resultValue - the API field name. Check for null/undefined explicitly
        value: item.resultValue !== null && item.resultValue !== undefined ? item.resultValue : item.value,
        unit: item.resultUnit || item.unit || '',
        dateTime: item.activityStartDate || item.dateTime || item.sampleDate || ''
      }));
    }
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching ${parameter}:`, error);
    return [];
  }
};

export const getLatestSamplingData = async (
  stationIds: string[],
  parameters: string[]
): Promise<Map<string, WaterQualityData>> => {
  const dataMap = new Map<string, WaterQualityData>();
  
  for (const param of parameters) {
    const data = await getSamplingData(stationIds, param);
    if (data.length > 0) {
      // Get the most recent data point
      const latest = data.sort((a, b) => 
        new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      )[0];
      dataMap.set(param, latest);
    }
  }
  
  return dataMap;
};
