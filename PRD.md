# Product Requirements Document
## Florida Waterbody Water Quality Dashboard

**Version:** 1.0 | **Date:** February 6, 2026

---

## Product Goal
Build a web app where users can click on Florida waterbodies on a map to see current water quality status through simple visual gauges, with the ability to drill down into historical charts.

---

## Core Features

### 1. Interactive Map
- Display map of Florida centered at 27.9°N, -82.5°W
- Show waterbody polygons from ArcGIS MapServer layer
- Click waterbody to select it and zoom to bounds
- Highlight on hover

**API:** `https://gis.waterinstitute.usf.edu/arcgis/rest/services/Maps/WaterAtlas_FrontPage/MapServer/14`

---

### 2. Waterbody Information
- Show sidebar panel when waterbody selected
- Display: Name, Type, Size (acres), Location
- Show sampling station count
- Display station markers on map

**API:** `GET https://dev.api.wateratlas.org/api/sampling-locations?waterBodyId={WBODYID}`  
**Swagger Docs:** https://dev.api.wateratlas.org/redoc/index.html#tag/Sampling-Locations/operation/GetSamplingLocations

---

### 3. Water Quality Gauges (Priority Feature)
- Show 4 dials/gauges for current water quality:
  - Dissolved Oxygen (DO)
  - Chlorophyll-a (Chla)
  - Total Nitrogen (TN)
  - Total Phosphorus (TP)
- Color code: Green (Good), Yellow (Fair), Red (Poor)
- Display most recent value and date

**API:** `GET https://dev.api.wateratlas.org/api/samplingdata?stationIds={ids}&parameter={param}`  
**Swagger Docs:** https://dev.api.wateratlas.org/redoc/index.html#tag/Sampling-Data/operation/GetSamplingData

**Thresholds:**
- DO: Good >6 mg/L, Fair 4-6, Poor <4
- Chla: Good <10 µg/L, Fair 10-30, Poor >30
- TN: Good <0.5 mg/L, Fair 0.5-1.0, Poor >1.0
- TP: Good <0.03 mg/L, Fair 0.03-0.1, Poor >0.1

---

### 4. Historical Charts (Advanced)
- "View Details" button to see time-series charts
- Line charts showing parameter trends over time
- Default: Last 1 year of data
- Toggle between 4 parameters
- Date range picker (30d, 90d, 1yr, 5yr, All)

---

### 5. Data Export
- Export CSV button
- Download filtered data for external analysis

---

## Data Sources

### ArcGIS MapServer (Waterbodies)
```
https://gis.waterinstitute.usf.edu/arcgis/rest/services/Maps/WaterAtlas_FrontPage/MapServer/14
```
- Layer 14 = Waterbody polygons
- Key fields: WBODYID, WATERBODYNAME, WBODYTYPE, SURFAREA_ACRES

### WaterAtlas API (Sampling Data)
```
Base: https://dev.api.wateratlas.org
Full API Documentation: https://dev.api.wateratlas.org/redoc/

Key Endpoints:
  - /api/sampling-locations (get stations)
    Docs: https://dev.api.wateratlas.org/redoc/index.html#tag/Sampling-Locations/operation/GetSamplingLocations
  
  - /api/samplingdata (get measurements)
    Docs: https://dev.api.wateratlas.org/redoc/index.html#tag/Sampling-Data/operation/GetSamplingData
  
  - /api/parameters (get parameter info)
    Docs: https://dev.api.wateratlas.org/redoc/index.html#tag/Parameters/operation/GetParameters
```

**Parameters:**
- `DO_mgl` - Dissolved Oxygen (mg/L)
- `Chla_ugl` - Chlorophyll-a (µg/L)
- `TN_mgl` - Total Nitrogen (mg/L)
- `TP_mgl` - Total Phosphorus (mg/L)

---

## Tech Stack
- React 18 + TypeScript + Vite
- Leaflet + Esri-Leaflet
- Axios
- Chart.js
- Tailwind CSS

---

## Success Criteria
- Map loads in < 3 seconds
- Click waterbody → see gauges within 2 seconds
- Mobile responsive (320px+)
- Handle API errors gracefully

---

**Start:** TASK 1 - Create Vite + React + TypeScript project