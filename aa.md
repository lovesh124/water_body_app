# Functional Requirements Document: Interactive Waterbody Map Application



---

## 1. Executive Summary

### 1.1 Purpose
Develop a web-based interactive mapping application that enables users to explore Florida waterbodies, view sampling station locations, and analyze historical water quality data through intuitive visualizations.

### 1.2 Scope
The application will integrate ArcGIS MapServer layers for waterbody geometry with WaterAtlas API for sampling data, focusing on four key water quality parameters: Dissolved Oxygen (DO), Chlorophyll-a (Chla), Total Nitrogen (TN), and Total Phosphorus (TP).

### 1.3 Reference Implementation
PCDEM Shiny Dashboard: https://pcdem.shinyapps.io/dashboard/#section-water-quality

---

## 2. System Overview

### 2.1 Data Sources

**Primary Map Layer:**
- **Source:** USF Water Institute ArcGIS MapServer
- **URL:** https://gis.waterinstitute.usf.edu/arcgis/rest/services/Maps/WaterAtlas_FrontPage/MapServer/14
- **Data Type:** Waterbody polygons with metadata (name, type, coordinates, surface area)

**Water Quality Data API:**
- **Source:** WaterAtlas Development API
- **Base URL:** https://dev.api.wateratlas.org
- **Key Endpoints:**
  - `/api/sampling-locations` - Station locations within waterbodies
  - `/api/samplingdata` - Historical water quality measurements
  - `/api/parameters` - Parameter metadata and definitions

### 2.2 Target Parameters
- **DO_mgl:** Dissolved Oxygen (mg/L)
- **Chla_ugl:** Chlorophyll-a (µg/L)
- **TN_mgl:** Total Nitrogen (mg/L)
- **TP_mgl:** Total Phosphorus (mg/L)

---

## 3. Functional Requirements

### 3.1 Map Display and Navigation

**FR-3.1.1: Base Map Rendering**
- **Description:** Display an interactive web map centered on Florida waterbodies
- **Acceptance Criteria:**
  - Map loads with default view centered at coordinates [27.9°N, -82.5°W]
  - Zoom level set to 9 on initial load
  - Base map tiles (OpenStreetMap or similar) render properly
  - Map supports pan, zoom, and standard navigation controls
  - Mobile-responsive and touch-enabled

**FR-3.1.2: Waterbody Layer Display**
- **Description:** Overlay waterbody polygons from ArcGIS MapServer layer 14
- **Acceptance Criteria:**
  - All waterbody polygons render with semi-transparent fill (30% opacity)
  - Polygon boundaries display with 2px stroke
  - Visual styling distinguishes waterbodies from base map
  - Layer performs efficiently with 2000+ features
  - Polygons highlight on hover to indicate interactivity

**FR-3.1.3: Waterbody Selection**
- **Description:** Enable users to click waterbody polygons to select them
- **Acceptance Criteria:**
  - Click on any waterbody polygon triggers selection event
  - Selected waterbody visually highlights (different color/opacity)
  - Map centers/zooms to selected waterbody extent
  - Only one waterbody can be selected at a time
  - Click outside deselects current waterbody

---

### 3.2 Waterbody Information Display

**FR-3.2.1: Waterbody Details Panel**
- **Description:** Display metadata for selected waterbody
- **Data Fields:**
  - Waterbody Name (`WATERBODYNAME`)
  - Waterbody Type (`WBODYTYPE`) - e.g., Lake, River, Bay, Estuary
  - Alternative Names (`ALTNAMES`)
  - Surface Area (`SURFAREA_ACRES`) in acres
  - River Length (`RIVERLENGTH_FT`) in feet (if applicable)
  - Associated Atlas Region (`ATLAS`)
  - Coordinates (`LATITUDE_DD`, `LONGITUDE_DD`)
  - Waterbody ID (`WBODYID`)
- **Acceptance Criteria:**
  - Panel opens automatically when waterbody is selected
  - All available fields display in user-friendly format
  - Null/empty fields are hidden or show "N/A"
  - Panel can be minimized/closed by user
  - Panel is responsive on mobile devices

---

### 3.3 Sampling Station Management

**FR-3.3.1: Fetch Sampling Locations**
- **Description:** Retrieve all sampling stations associated with selected waterbody
- **API Integration:**
  - **Endpoint:** `GET /api/sampling-locations`
  - **Parameters:** `waterBodyId={WBODYID}`, `pageSize=100`
- **Acceptance Criteria:**
  - API call triggers automatically when waterbody is selected
  - System handles pagination if stations exceed pageSize
  - Loading indicator displays during API call
  - Error handling for failed requests (retry logic)
  - Empty results display appropriate message

**FR-3.3.2: Display Station Markers**
- **Description:** Render markers on map for each sampling station
- **Acceptance Criteria:**
  - Each station displays as a distinct map marker/pin
  - Markers positioned at exact lat/long coordinates from API
  - Markers layered above waterbody polygons
  - Visual distinction from waterbody polygons (different icon/color)
  - Markers cluster when zoomed out (optional enhancement)

**FR-3.3.3: Station Information Popups**
- **Description:** Show station details when marker is clicked
- **Data Fields:**
  - Station Name (`name`)
  - Station ID (`stationId`)
  - Data Source (`dataSource`) - organization collecting data
  - County (`county`)
  - Coordinates (`latitude`, `longitude`)
  - Link/button to view station data
- **Acceptance Criteria:**
  - Popup appears on marker click
  - Popup styled consistently with application design
  - Close button provided
  - Clicking another marker closes previous popup

**FR-3.3.4: Station List Sidebar**
- **Description:** Display list of all stations in selected waterbody
- **Acceptance Criteria:**
  - List updates when new waterbody is selected
  - Shows station count (e.g., "15 stations found")
  - Each list item displays station name and ID
  - Clicking list item highlights corresponding marker
  - List is scrollable if many stations exist
  - Option to select multiple stations for comparison

---

### 3.4 Water Quality Data Retrieval

**FR-3.4.1: Fetch Sampling Data**
- **Description:** Retrieve water quality measurements for selected stations
- **API Integration:**
  - **Endpoint:** `GET /api/samplingdata`
  - **Parameters:**
    - `stationIds` - Array of selected station IDs
    - `parameter` - One of: `DO_mgl`, `Chla_ugl`, `TN_mgl`, `TP_mgl`
    - `startDate` - Optional date filter (ISO 8601 format)
    - `endDate` - Optional date filter
    - `pageSize=5000` - Large size to minimize pagination
- **Acceptance Criteria:**
  - API calls made when user selects stations and parameters
  - System handles multiple station IDs in single request
  - Data fetched for all four target parameters
  - Caching implemented to avoid redundant API calls
  - Loading states indicate data retrieval progress

**FR-3.4.2: Data Processing and Aggregation**
- **Description:** Transform raw API data into chart-ready format
- **Processing Requirements:**
  - Parse date strings to Date objects
  - Convert string coordinates to numeric values
  - Group measurements by parameter type
  - Sort chronologically by `activityStartDate`
  - Handle duplicate measurements (average or flag)
  - Filter out invalid/null values
  - Calculate basic statistics (min, max, mean, median)
- **Acceptance Criteria:**
  - Processed data structure matches chart library requirements
  - Invalid data points logged and excluded from charts
  - Processing completes within 2 seconds for 5000 records
  - Memory usage remains reasonable for large datasets

---

### 3.5 Data Visualization

**FR-3.5.1: Time Series Charts**
- **Description:** Display water quality parameter trends over time
- **Chart Types:**
  - Line charts for temporal trends
  - Scatter plots for individual measurements
  - Optional: Combined line + scatter
- **Chart Features:**
  - X-axis: Date/time
  - Y-axis: Parameter value with appropriate units
  - Chart title includes parameter name and station(s)
  - Legend if multiple stations displayed
  - Tooltips showing exact values on hover
  - Zoom/pan capabilities for detailed analysis
  - Export chart as image (PNG/SVG)
- **Acceptance Criteria:**
  - Charts render within 3 seconds of data load
  - Responsive sizing based on container
  - Smooth animations and transitions
  - Accessible to screen readers

**FR-3.5.2: Multi-Parameter Dashboard**
- **Description:** Display all four parameters simultaneously
- **Layout Options:**
  - 2x2 grid of charts (one per parameter)
  - Tabbed interface to switch between parameters
  - Dropdown selector for active parameter
- **Acceptance Criteria:**
  - All four parameter charts available
  - Charts synchronized (same time range, zoom level)
  - User can toggle between individual and combined views
  - Performance remains smooth with all charts visible

**FR-3.5.3: Parameter Comparison**
- **Description:** Overlay multiple stations on single chart
- **Acceptance Criteria:**
  - Different color/style for each station
  - Clear legend identifying each station
  - Option to show/hide individual stations
  - Statistical comparison (which station has higher values)

**FR-3.5.4: Data Table View**
- **Description:** Display raw data in tabular format
- **Columns:**
  - Date/Time
  - Station ID
  - Parameter
  - Value
  - Unit
  - Data Source
  - Comments (if any)
- **Acceptance Criteria:**
  - Sortable by any column
  - Filterable by date range, station, parameter
  - Paginated for large datasets
  - Export to CSV functionality
  - Copy to clipboard option

---

### 3.6 Filtering and Date Selection

**FR-3.6.1: Date Range Picker**
- **Description:** Allow users to filter data by temporal range
- **Features:**
  - Calendar-based date picker UI
  - Predefined ranges: Last 30 days, 90 days, 1 year, 5 years, All time
  - Custom date range selection
  - Start date and end date inputs
- **Acceptance Criteria:**
  - Date picker opens on click
  - Invalid date ranges prevented (end before start)
  - Date selection triggers data re-fetch
  - Default range: Last 1 year
  - Maximum range: All available data

**FR-3.6.2: Parameter Selector**
- **Description:** Toggle between different water quality parameters
- **Acceptance Criteria:**
  - Radio buttons or dropdown for four parameters
  - Parameter names display with full descriptions
  - Selection updates charts immediately
  - Current parameter highlighted/indicated
  - Keyboard navigation supported

**FR-3.6.3: Station Filter**
- **Description:** Select which stations to include in analysis
- **Features:**
  - Checkboxes for each station
  - "Select All" / "Deselect All" buttons
  - Search/filter stations by name or ID
- **Acceptance Criteria:**
  - At least one station must be selected
  - Chart updates when selection changes
  - Selected stations persist until waterbody changes
  - Visual indicator of selection count

---

### 3.7 User Experience Features

**FR-3.7.1: Loading States**
- **Description:** Provide feedback during asynchronous operations
- **Acceptance Criteria:**
  - Spinner/skeleton screen during map load
  - Loading indicator during API calls
  - Progress bar for large data fetches
  - Disabled buttons prevent duplicate requests
  - Timeout handling (30 second max)

**FR-3.7.2: Error Handling**
- **Description:** Gracefully handle failures and edge cases
- **Error Scenarios:**
  - Network connectivity issues
  - API server errors (500, 503)
  - Invalid waterbody ID (no stations found)
  - No data available for selected date range
  - CORS issues
  - Timeout errors
- **Acceptance Criteria:**
  - User-friendly error messages (no technical jargon)
  - Retry button for failed requests
  - Automatic retry with exponential backoff
  - Fallback content when data unavailable
  - Error logging for debugging

**FR-3.7.3: Caching Strategy**
- **Description:** Store API responses to improve performance
- **Caching Rules:**
  - Waterbody layer geometry: Cache for session
  - Sampling locations: Cache for 24 hours
  - Sampling data: Cache for 1 hour
  - Parameter definitions: Cache indefinitely
- **Acceptance Criteria:**
  - localStorage used for client-side cache
  - Cache keys include relevant parameters (waterbody ID, date range)
  - Cache invalidation logic implemented
  - Manual cache clear option in settings
  - Cache size monitoring (max 5MB)

**FR-3.7.4: Responsive Design**
- **Description:** Optimize layout for different screen sizes
- **Breakpoints:**
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Acceptance Criteria:**
  - Map scales appropriately on all devices
  - Sidebar becomes bottom drawer on mobile
  - Charts stack vertically on narrow screens
  - Touch gestures work on mobile (pinch zoom, swipe)
  - Text readable without zooming
  - Interactive elements have sufficient touch targets (min 44x44px)

**FR-3.7.5: Accessibility**
- **Description:** Ensure application is usable by all users
- **Requirements:**
  - WCAG 2.1 Level AA compliance
  - Keyboard navigation for all features
  - Screen reader support (ARIA labels)
  - Color contrast ratios meet standards
  - Alt text for non-text content
  - Focus indicators visible
  - No seizure-inducing animations
- **Acceptance Criteria:**
  - Passes automated accessibility audits (Lighthouse, axe)
  - Manual testing with screen readers (NVDA, VoiceOver)
  - Keyboard-only navigation possible

---

### 3.8 Additional Information Features

**FR-3.8.1: Parameter Information**
- **Description:** Display detailed information about water quality parameters
- **API Integration:**
  - **Endpoint:** `GET /api/parameters`
- **Information Displayed:**
  - Full parameter name
  - Description and significance
  - Measurement units
  - Typical ranges (normal, concerning, critical)
  - Regulatory thresholds (if applicable)
  - Environmental impacts
- **Acceptance Criteria:**
  - Info icon or link next to parameter names
  - Modal or tooltip displays parameter details
  - Content written for non-technical audience
  - Sources/references provided

**FR-3.8.2: Data Source Attribution**
- **Description:** Credit organizations providing water quality data
- **Acceptance Criteria:**
  - Data source displayed in chart legends
  - Full organization names shown (not just codes)
  - Link to data provider website (if available)
  - Collection methodology information
  - Last updated timestamp

---

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-4.1.1: Load Times**
- Initial page load: < 3 seconds
- Map tile rendering: < 2 seconds
- API response processing: < 2 seconds
- Chart rendering: < 3 seconds for 5000 data points
- Waterbody selection response: < 1 second

**NFR-4.1.2: Scalability**
- Support rendering 2000+ waterbody polygons
- Handle 100+ sampling stations per waterbody
- Process 5000+ data points per parameter
- Maintain smooth interactions (60 fps)

**NFR-4.1.3: Optimization**
- Lazy loading for off-screen content
- Code splitting for faster initial load
- Image/asset optimization
- Minification and compression of JS/CSS
- CDN delivery for static assets

### 4.2 Compatibility

**NFR-4.2.1: Browser Support**
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

**NFR-4.2.2: Device Support**
- Desktop (Windows, macOS, Linux)
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)
- Minimum screen size: 320px width

### 4.3 Security

**NFR-4.3.1: Data Privacy**
- No personal identifiable information collected
- No user authentication required (public data)
- HTTPS encryption for all API calls
- Content Security Policy headers

**NFR-4.3.2: API Security**
- Rate limiting compliance
- API key management (if required)
- Input validation/sanitization
- XSS prevention

### 4.4 Maintainability

**NFR-4.4.1: Code Quality**
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Unit test coverage > 80%
- Component-based architecture

**NFR-4.4.2: Documentation**
- Inline code comments for complex logic
- README with setup instructions
- API integration documentation
- Deployment guide
- Architecture decision records

---

## 5. Technical Architecture

### 5.1 Recommended Technology Stack

**Frontend Framework:** React 18+ with TypeScript  
**Build Tool:** Vite  
**Mapping Library:** Leaflet + Esri-Leaflet  
**Charting Library:** Chart.js or Plotly.js  
**HTTP Client:** Axios  
**State Management:** Zustand or React Context  
**Styling:** Tailwind CSS or CSS Modules  
**Date Handling:** date-fns  

### 5.2 Project Structure
```
waterbody-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── WaterbodyMap.tsx
│   │   │   ├── WaterbodyLayer.tsx
│   │   │   ├── StationMarkers.tsx
│   │   │   └── MapControls.tsx
│   │   ├── Charts/
│   │   │   ├── TimeSeriesChart.tsx
│   │   │   ├── MultiParameterDashboard.tsx
│   │   │   └── DataTable.tsx
│   │   ├── Sidebar/
│   │   │   ├── WaterbodyInfo.tsx
│   │   │   ├── StationList.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   └── ParameterSelector.tsx
│   │   └── UI/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── Modal.tsx
│   ├── services/
│   │   ├── arcgisService.ts
│   │   ├── wateratlasApi.ts
│   │   └── cacheService.ts
│   ├── types/
│   │   ├── waterbody.ts
│   │   ├── samplingLocation.ts
│   │   ├── samplingData.ts
│   │   └── parameter.ts
│   ├── utils/
│   │   ├── dataProcessing.ts
│   │   ├── dateHelpers.ts
│   │   └── formatters.ts
│   ├── hooks/
│   │   ├── useWaterbodySelection.ts
│   │   ├── useSamplingData.ts
│   │   └── useCache.ts
│   ├── store/
│   │   └── appStore.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 5.3 Data Flow
```
User Interaction
    ↓
Click Waterbody → Extract WBODYID
    ↓
API: /api/sampling-locations?waterBodyId={WBODYID}
    ↓
Display Station Markers + List
    ↓
Select Stations + Date Range + Parameter
    ↓
API: /api/samplingdata?stationIds=[...]&parameter=...&startDate=...
    ↓
Process Data (sort, filter, aggregate)
    ↓
Render Charts + Table
    ↓
User Exploration (zoom, filter, compare)
```

---

## 6. API Integration Specifications

### 6.1 ArcGIS MapServer Integration

**Base URL:** `https://gis.waterinstitute.usf.edu/arcgis/rest/services/Maps/WaterAtlas_FrontPage/MapServer`

**Layer 14 (Waterbodies):**
```javascript
// Esri-Leaflet implementation
const waterbodiesLayer = L.esri.featureLayer({
  url: 'https://gis.waterinstitute.usf.edu/arcgis/rest/services/Maps/WaterAtlas_FrontPage/MapServer/14',
  style: {
    color: '#4A90E2',
    weight: 2,
    fillOpacity: 0.3
  }
});

waterbodiesLayer.on('click', (e) => {
  const wbodyId = e.layer.feature.properties.WBODYID;
  handleWaterbodyClick(wbodyId);
});
```

### 6.2 WaterAtlas API Integration

**Base URL:** `https://dev.api.wateratlas.org`

**Endpoint 1: Get Sampling Locations**
```typescript
GET /api/sampling-locations

Request:
{
  waterBodyId: number,  // Required
  pageSize: number,     // Default: 10, Recommended: 100
  pageNumber: number    // Default: 1
}

Response:
{
  items: Array<{
    stationId: string,
    name: string,
    latitude: string,
    longitude: string,
    waterBodyId: number,
    waterBodyName: string,
    dataSource: string,
    county: string
  }>,
  totalCount: number,
  pageNumber: number,
  pageSize: number,
  totalPages: number
}
```

**Endpoint 2: Get Sampling Data**
```typescript
GET /api/samplingdata

Request:
{
  stationIds: string[],     // Array of station IDs
  parameter?: string,       // DO_mgl, Chla_ugl, TN_mgl, TP_mgl
  startDate?: string,       // ISO 8601 format
  endDate?: string,         // ISO 8601 format
  pageSize: number,         // Default: 10, Recommended: 5000
  pageNumber: number
}

Response:
{
  items: Array<{
    stationID: string,
    activityStartDate: string,
    parameter: string,
    characteristic: string,
    resultValue: number,
    resultUnit: string,
    medium: string,
    sampleFraction: string,
    wBodyID: number,
    waterBodyName: string,
    dataSource: string,
    resultComment?: string
  }>,
  totalCount: number,
  pageNumber: number,
  pageSize: number,
  totalPages: number
}
```

**Endpoint 3: Get Parameters**
```typescript
GET /api/parameters

Request:
{
  parameterCode?: string,
  name?: string,
  pageSize: number,
  pageNumber: number
}

Response:
{
  items: Array<{
    parameterID: number,
    parameter: string,      // Code (e.g., "TN_mgl")
    units: string,
    name: string,          // Human-readable name
    precision: number,
    graphDisplayName: string
  }>,
  totalCount: number,
  pageNumber: number,
  pageSize: number,
  totalPages: number
}
```

---

## 7. User Interface Mockup Description

### 7.1 Layout Components

**Main View (Desktop):**
- **Left Sidebar (30% width):**
  - Waterbody information panel
  - Station list with checkboxes
  - Date range picker
  - Parameter selector
  - Filter controls
  
- **Map View (70% width, top half):**
  - Interactive map with waterbody layer
  - Station markers
  - Map controls (zoom, reset, layers)
  
- **Chart View (70% width, bottom half):**
  - Time series charts
  - Data table toggle
  - Export buttons

**Mobile View:**
- Full-width map (collapsible)
- Bottom drawer for controls and data
- Tab navigation between map/data/info
- Hamburger menu for filters

### 7.2 Color Scheme
- **Primary:** Blue (#4A90E2) - Waterbodies
- **Secondary:** Teal (#1ABC9C) - Station markers
- **Accent:** Orange (#E67E22) - Selected/highlighted
- **Background:** Light gray (#F5F7FA)
- **Text:** Dark gray (#2C3E50)

---

## 8. Success Criteria

### 8.1 Functional Success
- ✓ User can click any Florida waterbody and view its information
- ✓ All sampling stations display correctly on map
- ✓ Water quality data loads and displays in charts
- ✓ All four parameters (DO, Chla, TN, TP) visualized
- ✓ Date filtering works correctly
- ✓ Multi-station comparison functional

### 8.2 Performance Success
- ✓ Initial load under 3 seconds
- ✓ Map interactions feel responsive (<100ms)
- ✓ Charts render smoothly with 5000+ points
- ✓ No memory leaks during extended use

### 8.3 Quality Success
- ✓ Zero critical bugs in production
- ✓ Accessibility audit passes
- ✓ Works on all target browsers
- ✓ Mobile experience is smooth
- ✓ Code coverage > 80%

---

## 9. Development Phases

### Phase 1: Foundation (Week 1-2)
- Project setup and configuration
- Basic map implementation with Leaflet
- ArcGIS layer integration
- Waterbody click handling

### Phase 2: API Integration (Week 3-4)
- WaterAtlas API service layer
- Sampling locations endpoint
- Station marker rendering
- Error handling and loading states

### Phase 3: Data Visualization (Week 5-6)
- Chart.js integration
- Time series chart implementation
- Multi-parameter dashboard
- Data table view

### Phase 4: Refinement (Week 7-8)
- Date range filtering
- Parameter selection
- Caching implementation
- Performance optimization

### Phase 5: Polish & Testing (Week 9-10)
- Responsive design
- Accessibility improvements
- Cross-browser testing
- Bug fixes and refinements

### Phase 6: Deployment (Week 11)
- Production build optimization
- Deployment setup
- Documentation
- User acceptance testing

---

## 10. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API rate limiting | High | Medium | Implement caching, batch requests |
| CORS issues | High | Medium | Use proxy server, request API CORS config |
| Large dataset performance | Medium | High | Pagination, virtual scrolling, data sampling |
| Browser compatibility | Medium | Low | Polyfills, progressive enhancement |
| Mobile performance | Medium | Medium | Lazy loading, simplified mobile UI |
| API downtime | High | Low | Graceful degradation, cached data fallback |

---

## 11. Future Enhancements (Out of Scope for v1.0)

- Multi-waterbody comparison
- Advanced statistical analysis (trend detection, anomaly detection)
- Water quality threshold alerts/notifications
- Historical data download (bulk export)
- User accounts and saved preferences
- Custom parameter support beyond the four hardcoded ones
- Real-time data updates (WebSocket integration)
- Predictive modeling
- Social sharing of visualizations
- Print-friendly reports
- 3D terrain visualization
- Weather overlay integration

---

## 12. Appendices

### Appendix A: Parameter Definitions
- **DO_mgl (Dissolved Oxygen):** Amount of oxygen dissolved in water, critical for aquatic life. Measured in milligrams per liter (mg/L). Healthy levels typically range from 5-14 mg/L depending on temperature and salinity.
- **Chla_ugl (Chlorophyll-a):** Indicator of algae biomass, relates to water clarity. Measured in micrograms per liter (µg/L). High levels indicate potential algal blooms and eutrophication.
- **TN_mgl (Total Nitrogen):** Nutrient that can cause algal blooms when excessive. Measured in milligrams per liter (mg/L). Includes all forms of nitrogen (organic, ammonia, nitrate, nitrite).
- **TP_mgl (Total Phosphorus):** Nutrient limiting factor in freshwater systems. Measured in milligrams per liter (mg/L). Often the primary driver of algal growth in lakes and rivers.

### Appendix B: Technical References
- **Leaflet Documentation:** https://leafletjs.com/
- **Esri-Leaflet Documentation:** https://esri.github.io/esri-leaflet/
- **Chart.js Documentation:** https://www.chartjs.org/
- **WaterAtlas API:** https://dev.api.wateratlas.org/redoc/
- **ArcGIS REST API:** https://developers.arcgis.com/rest/

### Appendix C: Example API Calls

**Example 1: Get Stations for Tampa Bay**
```bash
curl -X GET "https://dev.api.wateratlas.org/api/sampling-locations?waterBodyId=14143&pageSize=100&pageNumber=1"
```

**Example 2: Get Dissolved Oxygen Data**
```bash
curl -X GET "https://dev.api.wateratlas.org/api/samplingdata?stationIds=G4SW0041&parameter=DO_mgl&startDate=2025-01-01T00:00:00Z&endDate=2026-01-31T00:00:00Z&pageSize=5000"
```

**Example 3: Get Parameter Definitions**
```bash
curl -X GET "https://dev.api.wateratlas.org/api/parameters?pageSize=100&pageNumber=1"
```

### Appendix D: Key Waterbody Fields Reference

| Field Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| OBJECTID | Integer | Unique feature ID | 1234 |
| WBODYID | Integer | Waterbody identifier | 1002956 |
| WATERBODYNAME | String(150) | Official name | "Blue Cove, Lake" |
| ALTNAMES | String(255) | Alternative names | "Lake Blue Cove" |
| WBODYTYPE | String(25) | Type classification | "Lake", "River", "Bay" |
| LATITUDE_DD | Double | Centroid latitude | 29.05241 |
| LONGITUDE_DD | Double | Centroid longitude | -82.45244 |
| SURFAREA_ACRES | Double | Surface area | 125.5 |
| RIVERLENGTH_FT | Integer | Length if river | 5280 |
| ATLAS | String(50) | Regional atlas | "Tampa Bay" |

---

**Document Status:** Final v1.0  
**Approved By:** Development Team  
**Next Steps:** Convert to PDF, begin Phase 1 development

**Change Log:**
- v1.0 (2026-01-31): Initial release of comprehensive FRD