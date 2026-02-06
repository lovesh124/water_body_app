export interface Waterbody {
  WBODYID: string;
  WATERBODYNAME: string;
  WBODYTYPE: string | null;
  SURFAREA_ACRES: number | null;
  geometry?: any;
}

export interface SamplingStation {
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  waterBodyId: string;
}

export interface WaterQualityData {
  stationId: string;
  parameter: string;
  value: number;
  unit: string;
  dateTime: string;
}

export interface WaterQualityGauge {
  parameter: string;
  value: number | null;
  unit: string;
  status: 'good' | 'fair' | 'poor' | 'unknown';
  date: string | null;
}

export type DateRange = '30d' | '90d' | '1yr' | '5yr' | 'all';
