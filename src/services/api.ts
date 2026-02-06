import axios from 'axios';
import { SamplingStation, WaterQualityData } from '../types';

const BASE_URL = 'https://dev.api.wateratlas.org';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getSamplingLocations = async (waterBodyId: string): Promise<SamplingStation[]> => {
  try {
    const response = await api.get(`/api/sampling-locations`, {
      params: { waterBodyId }
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching sampling locations:', error);
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
