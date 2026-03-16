export const PARAMETERS = {
  DO: 'DO_mgl',
  CHLA: 'Chla_ugl',
  TN: 'TN_mgl',
  TP: 'TP_mgl',
  PH: 'pH',
  SECCHI: 'Secchi_ft',
  TEMP_WATER_C: 'TempW_C',
  DO_PERCENT: 'DO_percent'
};

export const PARAMETER_LABELS = {
  [PARAMETERS.DO]: 'Dissolved Oxygen',
  [PARAMETERS.CHLA]: 'Chlorophyll-a',
  [PARAMETERS.TN]: 'Total Nitrogen',
  [PARAMETERS.TP]: 'Total Phosphorus',
  [PARAMETERS.PH]: 'pH',
  [PARAMETERS.SECCHI]: 'Secchi Depth',
  [PARAMETERS.TEMP_WATER_C]: 'Water Temperature',
  [PARAMETERS.DO_PERCENT]: 'Dissolved Oxygen Saturation'
};

export const PARAMETER_UNITS = {
  [PARAMETERS.DO]: 'mg/L',
  [PARAMETERS.CHLA]: 'µg/L',
  [PARAMETERS.TN]: 'mg/L',
  [PARAMETERS.TP]: 'mg/L',
  [PARAMETERS.PH]: '',
  [PARAMETERS.SECCHI]: 'ft',
  [PARAMETERS.TEMP_WATER_C]: '°C',
  [PARAMETERS.DO_PERCENT]: '%'
};

export const evaluateWaterQuality = (parameter: string, value: number): 'good' | 'fair' | 'poor' => {
  switch (parameter) {
    case PARAMETERS.DO:
      if (value > 6) return 'good';
      if (value >= 4) return 'fair';
      return 'poor';
    
    case PARAMETERS.CHLA:
      if (value < 10) return 'good';
      if (value <= 30) return 'fair';
      return 'poor';
    
    case PARAMETERS.TN:
      if (value < 0.5) return 'good';
      if (value <= 1.0) return 'fair';
      return 'poor';
    
    case PARAMETERS.TP:
      if (value < 0.03) return 'good';
      if (value <= 0.1) return 'fair';
      return 'poor';

    case PARAMETERS.PH:
      if (value >= 6.5 && value <= 8.5) return 'good';
      if ((value >= 6.0 && value < 6.5) || (value > 8.5 && value <= 9.0)) return 'fair';
      return 'poor';

    case PARAMETERS.SECCHI:
      if (value >= 6) return 'good';
      if (value >= 3) return 'fair';
      return 'poor';

    case PARAMETERS.TEMP_WATER_C:
      if (value >= 20 && value <= 28) return 'good';
      if ((value >= 15 && value < 20) || (value > 28 && value <= 32)) return 'fair';
      return 'poor';

    case PARAMETERS.DO_PERCENT:
      if (value >= 90) return 'good';
      if (value >= 75) return 'fair';
      return 'poor';
    
    default:
      return 'fair';
  }
};

export const getStatusColor = (status: 'good' | 'fair' | 'poor' | 'unknown'): string => {
  switch (status) {
    case 'good':
      return '#22c55e'; // green-500
    case 'fair':
      return '#eab308'; // yellow-500
    case 'poor':
      return '#ef4444'; // red-500
    default:
      return '#9ca3af'; // gray-400
  }
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
