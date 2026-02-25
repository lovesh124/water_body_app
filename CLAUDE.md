# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Type-check + build for production (tsc && vite build)
npm run preview   # Preview production build locally
```

No test runner is configured.

## Architecture

This is a single-page React + TypeScript app built with Vite. The layout is a 50/50 horizontal split (stacked on mobile): **map on the left, sidebar on the right**.

### Data Flow

1. `MapComponent` renders an Esri-Leaflet feature layer from the ArcGIS MapServer. When a user clicks a waterbody polygon, its `WBODYID` and metadata are passed up to `App` via `onWaterbodySelect`.
2. `App` holds `selectedWaterbody` state and passes it down to `Sidebar`.
3. `Sidebar` fetches sampling stations (`/api/sampling-locations?waterBodyId=…`) then fetches gauge data for each of the 4 parameters sequentially, updating each gauge as results arrive. An `AbortController` ref cancels in-flight requests when the selected waterbody changes.
4. `HistoricalChart` is a full-screen modal rendered by `Sidebar` — it receives station IDs and fetches time-series data for a selected parameter + date range.

### API Proxy

In development, Vite proxies `/api/*` → `https://dev.api.wateratlas.org` (see `vite.config.ts`). The `api.ts` service uses a relative base URL in dev and the full URL in production. The API timeout is 60 seconds.

API calls cap station IDs at 5 (to avoid URL length limits) and use `pageSize: 10` for gauge data. The `getSamplingData` function maps API response fields (`resultValue`, `activityStartDate`, `stationID`) to the internal `WaterQualityData` shape.

### Key Files

| File | Purpose |
|---|---|
| `src/types.ts` | All shared TypeScript interfaces (`Waterbody`, `SamplingStation`, `WaterQualityData`, `WaterQualityGauge`, `DateRange`) |
| `src/services/api.ts` | Axios client + all WaterAtlas API calls |
| `src/utils/waterQuality.ts` | Parameter constants (`PARAMETERS`, `PARAMETER_LABELS`, `PARAMETER_UNITS`), threshold evaluation (`evaluateWaterQuality`), status colors, CSV export |
| `src/components/MapComponent.tsx` | Leaflet map with Esri feature layer; county filter via `ATLAS_<COUNTY> = 'Y'` WHERE clause |
| `src/components/Sidebar.tsx` | Waterbody detail panel; orchestrates station + gauge data loading |
| `src/components/Gauge.tsx` | Visual dial component for a single `WaterQualityGauge` |
| `src/components/HistoricalChart.tsx` | Chart.js line chart modal for time-series data |

### Water Quality Parameters & Thresholds

Parameter API IDs: `DO_mgl`, `Chla_ugl`, `TN_mgl`, `TP_mgl`

| Parameter | Good | Fair | Poor |
|---|---|---|---|
| Dissolved Oxygen (mg/L) | >6 | 4–6 | <4 |
| Chlorophyll-a (µg/L) | <10 | 10–30 | >30 |
| Total Nitrogen (mg/L) | <0.5 | 0.5–1.0 | >1.0 |
| Total Phosphorus (mg/L) | <0.03 | 0.03–0.1 | >0.1 |

### Theming

Light/dark mode is toggled in `App.tsx` and persisted to `localStorage`. The Tailwind `dark:` variant is driven by a `dark` class on `<html>`. The theme is also set via `data-theme` attribute.

### County Filter

`MapComponent` accepts a `county` prop. When set, the Esri feature layer applies `WHERE ATLAS_<COUNTY> = 'Y'`. The available counties are hard-coded in `MapComponent` (`Hillsborough`, `Pinellas`, `Manatee`, `Sarasota`, `Polk`, `Seminole`, `Lake`, `Orange`). The default is `Hillsborough`.
