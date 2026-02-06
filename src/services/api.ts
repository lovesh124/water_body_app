import axios from 'axios';
import { SamplingStation, WaterQualityData } from '../types';

// Use relative URL in development (proxied via Vite)
// In production, this should be the full API URL
const BASE_URL = import.meta.env.DEV ? '' : 'https://dev.api.wateratlas.org';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getSamplingLocations = async (waterBodyId: string): Promise<SamplingStation[]> => {
  try {
    console.log('API call: getSamplingLocations for waterBodyId:', waterBodyId);
    const response = await api.get(`/api/sampling-locations`, {
      params: { waterBodyId }
    });
    console.log('API response:', response.data);
    
    // Handle paginated response - extract items array
    if (response.data && response.data.items) {
      return response.data.items;
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching sampling locations:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Request URL:', error.config?.url);
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
    const response = await api.get(`/api/samplingdata`, {
      params: {
        stationIds: stationIds.join(','),
        parameter,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching sampling data:', error);
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
