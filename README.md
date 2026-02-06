# Florida Waterbody Water Quality Dashboard

A web application for visualizing water quality data across Florida waterbodies.

## Features

- **Interactive Map**: Click on Florida waterbodies to view detailed information
- **Water Quality Gauges**: Visual indicators for 4 key parameters (DO, Chlorophyll-a, TN, TP)
- **Historical Charts**: View time-series data with customizable date ranges
- **Data Export**: Download water quality data as CSV files
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

### Build for Production

```bash
npm run build
```

## Tech Stack

- React 18
- TypeScript
- Vite
- Leaflet + Esri-Leaflet
- Chart.js
- Tailwind CSS
- Axios

## Data Sources

- **Waterbody Polygons**: ArcGIS MapServer
- **Water Quality Data**: WaterAtlas API (https://dev.api.wateratlas.org)

## Parameters Monitored

- **Dissolved Oxygen (DO)**: mg/L - Good >6, Fair 4-6, Poor <4
- **Chlorophyll-a (Chla)**: µg/L - Good <10, Fair 10-30, Poor >30
- **Total Nitrogen (TN)**: mg/L - Good <0.5, Fair 0.5-1.0, Poor >1.0
- **Total Phosphorus (TP)**: mg/L - Good <0.03, Fair 0.03-0.1, Poor >0.1

## License

MIT
