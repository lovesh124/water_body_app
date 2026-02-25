# Project Guidelines

## Build And Run
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build production bundle: `npm run build`
- Preview production build: `npm run preview`

## Testing And Linting
- No test runner or lint script is configured yet.
- If a change is risky, prefer lightweight runtime checks and TypeScript error checks before finishing.

## Architecture
- `src/App.tsx` composes the page layout and app-level theme state.
- `src/components/MapComponent.tsx` owns Leaflet + Esri layer setup and waterbody click interactions.
- `src/components/Sidebar.tsx` owns waterbody detail loading, gauge updates, retry behavior, and chart modal launch.
- `src/components/HistoricalChart.tsx` loads and renders time-series data for a selected parameter/date range.
- `src/services/api.ts` is the single HTTP layer (Axios instance, timeout, request cancellation support, API field mapping).
- `src/utils/waterQuality.ts` contains parameter constants, thresholds, status colors, and CSV export helpers.

## Data And API Conventions
- In development, API calls should use relative `/api/*` paths and Vite proxy routing (`vite.config.ts`).
- In production, API base URL is set in `src/services/api.ts`.
- Keep request cancellation wired through `AbortSignal` when adding or changing async data loaders.
- Keep parameter requests for sidebar gauges sequential unless explicitly changing UX/performance strategy.
- Preserve API-to-UI field mapping behavior (`resultValue`, `resultUnit`, `activityStartDate`) and null-safe value handling.

## UI Conventions
- Use Tailwind utilities and existing component patterns for consistency.
- Dark mode is class-based (`darkMode: 'class'`) and controlled by toggling `document.documentElement`.
- Keep light/dark changes consistent across App, Sidebar, map overlay controls, gauges, and modal surfaces.
- Maintain modal/map layering by keeping historical modal z-index above map overlays.

## Known Pitfalls
- Avoid replacing canceled-request handling with generic errors; canceled Axios requests are expected flows.
- Avoid reintroducing parallel parameter fetch bursts in sidebar data loading.
- Be careful with map event handlers; callback refs are used to avoid stale closures.
- The chart "all" range is intentionally mapped to a fixed historical start year.
