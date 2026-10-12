# Climate Hazard Trend Analyzer 🌡️📊

A full-stack climate intelligence web application built for the **Dygnify Ventures Pvt Ltd** Full-Stack Developer technical assessment. The application ingests decades of historical meteorological data, applies domain-specific climatological algorithms to detect climate hazards (such as heatwaves, heavy rainfall, and prolonged droughts), performs statistical trend analysis (linear regression and the Mann-Kendall test), caches data in a NoSQL database, and visualizes longitudinal trends via an interactive React dashboard.

---

## 📑 Table of Contents
1. [Key Features & Implemented Bonus Challenges](#key-features--implemented-bonus-challenges)
2. [System Architecture](#system-architecture)
3. [Climate Hazard Detection Logic](#climate-hazard-detection-logic)
4. [Trend Detection & Statistical Rigor](#trend-detection--statistical-rigor)
5. [Data Ingestion & Quality Handling](#data-ingestion--quality-handling)
6. [NoSQL Database & Caching Strategy](#nosql-database--caching-strategy)
7. [Security & Performance](#security--performance)
8. [Quick Start & Setup Instructions](#quick-start--setup-instructions)
9. [Running Automated Tests](#running-automated-tests)
10. [Assumptions & Climatological Caveats](#assumptions--climatological-caveats)
11. [What I Would Improve with More Time](#what-i-would-improve-with-more-time)
12. [AI Tools Used & Methodology](#ai-tools-used--methodology)

---

## 🚀 Key Features & Implemented Bonus Challenges

- **Frontend (React 18 + Vite + Tailwind CSS)**:
  - **Geographic Selector**: Quick-select presets for major global cities (*New Delhi, Phoenix, London, Madrid, Tokyo, Sydney, Cairo, etc.*) or enter custom latitude/longitude coordinates.
  - **Bonus Challenge 1 — Interactive Map UI**: Built-in Leaflet map (`react-leaflet`) allowing users to click anywhere on the globe to pinpoint exact coordinates.
  - **Hazard Type**: **Heatwave** is selected by default; toggles available for Extreme Rainfall and Prolonged Drought.
  - **Time Range Controls**: Interactive sliders spanning 1950 to 2023 with span validation (minimum 5-year window for meaningful climate trends).
  - **Interactive Visualizations (Recharts)**:
    - Annual Hazard Frequency bar chart with overlaid **OLS Linear Trendline** and **5-Year Rolling Average**.
    - Hazard Duration chart comparing mean event duration and maximum spell length.
    - Cumulative Hazard Intensity area chart.
    - High-resolution daily temperature timeline showing 95th percentile threshold line and detected heatwave spells.
  - **Executive Summary Card**: Clear, honest insights (e.g., *"Heatwaves have increased by +42.1% in New Delhi since 1990"*).
  - **Bonus Challenge 2 — PDF & CSV Export**: One-click download of structured CSV dataset and formatted executive PDF report.
  - **Bonus Challenge 3 — Advanced Trend Detection**: Both OLS Linear Regression and the non-parametric **Mann-Kendall Trend Test** (Tau, Z-score, p-value).

- **Backend (Python 3.11 + FastAPI + NumPy + Pandas + SciPy)**:
  - **NoSQL Document Storage**: Dual-mode MongoDB integration with automated zero-setup TinyDB fallback.
  - **Safe External Ingestion**: Automated retry with exponential backoff against Open-Meteo ERA5 archive.
  - **Rate Limiting**: Integrated SlowAPI rate-limiting (`60 req/min`).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User["User Browser / Client"]
    Frontend["React 18 Dashboard (Vite + Tailwind + Recharts + Leaflet)"]
    FastAPI["FastAPI Backend (Python 3.11)"]
    NoSQL["NoSQL Database (MongoDB / TinyDB Fallback)"]
    OpenMeteo["Open-Meteo Historical Weather API (ECMWF ERA5)"]

    User -->|Selects Region, Hazard, Years| Frontend
    Frontend -->|POST /api/analyze| FastAPI
    FastAPI -->|Check Cache Key| NoSQL
    NoSQL -.->|Cache HIT (7-day TTL)| FastAPI
    FastAPI -->|Cache MISS: Fetch Daily Tmax & Precip| OpenMeteo
    OpenMeteo -->|Raw Weather Series| FastAPI
    FastAPI -->|1. Data Cleaning & Outlier Clipping| FastAPI
    FastAPI -->|2. Run-Length Exceedance Detection| FastAPI
    FastAPI -->|3. OLS Regression & Mann-Kendall Test| FastAPI
    FastAPI -->|Store Processed Result| NoSQL
    FastAPI -->|Return JSON Payload| Frontend
    Frontend -->|Render Charts, KPIs & Maps| User
```

---

## 🌡️ Climate Hazard Detection Logic

### Heatwave Definition (World Meteorological Organization standard)
A fixed universal temperature (e.g. 40°C) is unscientific because 40°C is typical for New Delhi in June but catastrophically anomalous in London. Therefore, the application uses **percentile-based relative climatology**:

1. **Threshold Calculation**:
   The 95th percentile ($P_{95}$) is calculated from the local daily maximum temperature series ($T_{\max}$):
   $$\text{Threshold} = P_{95}(T_{\max})$$
2. **Consecutive Spell Detection (Run-Length Encoding)**:
   A heatwave event occurs when:
   $$T_{\max}(t) > P_{95} \quad \text{for } \ge 3 \text{ consecutive days}$$
3. **Hazard Event Metrics**:
   - **Duration ($D$)**: Number of contiguous days in the exceedance spell.
   - **Peak Temperature ($T_{\text{peak}}$)**: $\max(T_{\max})$ during the spell.
   - **Cumulative Intensity / Excess Heat ($I$)**:
     $$I = \sum_{t=1}^{D} \left(T_{\max}(t) - P_{95}\right)$$

### Multi-Hazard Support
- **Extreme Rainfall**: Daily precipitation exceeding the local 95th percentile.
- **Prolonged Drought**: Spells of $\ge 15$ consecutive dry days ($\text{precipitation} < 1.0\text{ mm}$).

---

## 📈 Trend Detection & Statistical Rigor

### 1. Non-Parametric Mann-Kendall Trend Test
Climate event counts (e.g., number of heatwaves per year) are discrete, non-normally distributed counts subject to interannual variability (e.g., ENSO cycles). The **Mann-Kendall test** tests for monotonic upward or downward trends without assuming normality:

- **Kendall's S Statistic**:
  $$S = \sum_{k=1}^{n-1} \sum_{j=k+1}^n \text{sgn}(x_j - x_k)$$
- **Ties-Adjusted Variance**:
  $$\text{Var}(S) = \frac{n(n-1)(2n+5) - \sum_{i=1}^m t_i(t_i-1)(2t_i+5)}{18}$$
- **Standardized Test Statistic ($Z$) & Two-Tailed p-value**:
  Evaluates statistical significance at the 95% confidence level ($\alpha = 0.05$).

### 2. Ordinary Least Squares (OLS) Linear Regression
- Computes trend slope ($m$, events/year), decade rate of change ($10 \times m$), and coefficient of determination ($R^2$).

### 3. Centered Rolling Averages
- Computes 3-year and 5-year rolling averages to filter high-frequency noise and highlight multi-year climatological shifts.

### 4. Percentage Change Formulation
Compares the baseline period (first third of the selected timeline) against the recent period (final third):
$$\Delta\% = \frac{\overline{\text{Freq}}_{\text{recent}} - \overline{\text{Freq}}_{\text{baseline}}}{\overline{\text{Freq}}_{\text{baseline}}} \times 100$$

---

## 🧹 Data Ingestion & Quality Handling

- **Source**: ECMWF ERA5 reanalysis via the Open-Meteo Historical Weather Archive (`https://archive-api.open-meteo.com/v1/archive`).
- **Gaps & Missing Dates**: Full calendar date ranges are generated. Missing dates or NaN values are identified and imputed using linear interpolation for isolated gaps ($\le 3$ days), with data completeness reported in the metadata.
- **Physical Outlier Bounds**:
  - Daily maximum temperature clipped to physically realistic terrestrial boundaries: $[-90^\circ\text{C}, +65^\circ\text{C}]$.
  - Daily precipitation clipped to $[0\text{ mm}, 1500\text{ mm}]$.
- **External API Resilience**: Implemented asynchronous HTTP client (`httpx`) with 30-second timeout, 3-stage exponential backoff, and 429 rate-limit handling.

---

## 💾 NoSQL Database & Caching Strategy

The assignment specifies: *"Store this data in a NoSQL database. On an API call, read this data from the database and return JSON summaries and trend plots."*

The architecture implements a **Dual-Mode NoSQL Caching Engine**:
1. **Primary**: **MongoDB** (`pymongo`) for production environments and Docker Compose deployments.
2. **Zero-Setup Fallback**: **TinyDB** (a pure-Python document-based NoSQL database storing records in JSON format at `backend/data/nosql_db.json`). If MongoDB is not running locally, the application automatically falls back to TinyDB with zero manual configuration.
3. **Caching Layers**:
   - `weather_cache`: Stores raw historical meteorological records keyed by SHA-256 hash of `(latitude, longitude, start_year, end_year)`.
   - `analysis_cache`: Stores full computed hazard metrics keyed by SHA-256 hash of `(latitude, longitude, start_year, end_year, hazard_type, percentile, min_duration)`.
   - **TTL**: 7 days (604,800 seconds).

---

## 🔒 Security & Performance

- **Rate Limiting**: Configured using SlowAPI (`60 requests / minute` per IP address) to prevent API abuse.
- **Input Validation**: Pydantic v2 schemas enforce coordinate limits:
  - Latitude: $-90^\circ \le \phi \le +90^\circ$
  - Longitude: $-180^\circ \le \lambda \le +180^\circ$
  - Years: $1950 \le \text{year} \le 2024$ with $\text{end\_year} - \text{start\_year} \ge 4$.
- **CORS Protection**: Explicit origins enabled for local and containerized clients.
- **Payload Optimization**: Only recent daily series (last 3 years) are shipped in the interactive drill-down chart payload to keep network transfers sub-millisecond.

---

## ⚡ Quick Start & Setup Instructions

### Option A: 1-Command Docker Compose (Recommended)

Make sure Docker and Docker Compose are installed and running:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API & Interactive Swagger Docs: `http://localhost:8000/docs`
- MongoDB: `localhost:27017`

---

### Option B: Local Development Setup

#### 1. Backend Setup (Python 3.11+)
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000`.

#### 2. Frontend Setup (Node.js 18+)
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Unit tests verify the climatological hazard detection rules, edge cases, and trend calculations:
```bash
cd backend
pytest tests/ -v
```

Tests include:
- `test_heatwave_detection_consecutive_days`: Validates that a 2-day spike is correctly ignored and only $\ge 3$ consecutive days trigger a heatwave event.
- `test_zero_hazard_events_handling`: Validates that years with zero exceedances do not trigger divide-by-zero or NaN issues.
- `test_trend_analyzer_increasing_trend`: Validates positive linear slope and Mann-Kendall detection on rising series.
- `test_trend_analyzer_stable_trend`: Validates flat series reports no statistical trend.

---

## 🔍 Assumptions & Climatological Caveats

1. **Reanalysis vs Weather Station Data**:
   The Open-Meteo Historical Weather API is powered by ECMWF ERA5 reanalysis ($0.25^\circ \times 0.25^\circ$, roughly $11\text{ km}$ resolution). Reanalysis provides complete global coverage with no sensor gaps, but may slightly smooth localized microclimates (such as extreme urban heat island hotspots).
2. **Climatological Baseline**:
   By default, the 95th percentile is computed over the selected historical period for that specific geographical coordinate.
3. **Minimum Trend Period**:
   Climate science typically requires at least 30 years of data to separate long-term forced climate trends from natural internal variability (such as the Atlantic Multidecadal Oscillation or ENSO). The app enforces a minimum 5-year span and recommends 30 years (e.g., 1990–2020).

---

## 🔮 What I Would Improve with More Time

1. **Spatial Bounding Box Averaging**: Ingest gridded multi-point polygon coordinates and compute spatial area-weighted averages across a bounding box rather than a single representative centroid.
2. **Excess Heat Factor (EHF) Index**: Implement the Australian Bureau of Meteorology EHF standard, which compares 3-day mean temperature against the past 30 days to account for human acclimatization.
3. **Automated CI/CD**: Add GitHub Actions workflow for automated testing (`pytest` and `npm run build`), linting (`ruff`, `eslint`), and automated deployment to Google Cloud Run or Render.
4. **Interactive Geospatial Heatmap**: Render interactive raster heatmaps showing spatial hazard gradients across neighboring districts using WebGL / MapLibre.

---

## 🤖 AI Tools Used & Methodology

In compliance with the assignment instructions:
- **AI Tools Used**: Google DeepMind's Antigravity coding assistant (powered by Gemini models).
- **How They Were Used**:
  1. **Scaffolding & Architecture**: Used to formulate the full-stack repository structure, FastAPI endpoints, Pydantic data models, and Tailwind styling.
  2. **Scientific Formulation**: Implemented the Mann-Kendall rank trend test equations with variance ties adjustment and WMO percentile-based heatwave detection rules.
  3. **Data Quality & Handling**: Structured robust error handling for Open-Meteo external API calls, physical outlier clipping, and linear gap interpolation.
  4. **Verification**: Drafted unit tests for the hazard detector and trend analyzer to ensure all edge cases are handled.
