# Citibike Data Analyzer

An AI-powered business intelligence tool for analyzing 2023 NYC Citibike trip data through natural language queries.

## Overview

This project transforms 40 million Citibike trip records into an interactive, queryable dataset using:
- **Pre-aggregated index** for instant insights (monthly trends, peak hours, popular stations)
- **Daily shards** for detailed analysis (specific time periods, custom filters, duration calculations)
- **LLM query planner** (Google Gemini) that generates structured queries from natural language
- **Server-side data processing** for fast, efficient analysis
- **Real-time chart generation** with Recharts

## Architecture

### Data Pipeline

```
CSV Files (10GB+)
    ↓
Daily Sharding + Index Generation (Node.js)
    ↓
├── index.json (1.3MB) - Daily summaries for 365 days
└── shards/ - 365 daily JSON files organized by month
    ├── 2023-01/2023-01-01.json
    ├── 2023-01/2023-01-02.json
    └── ...
```

### Query Flow

```
User Query
    ↓
Google Gemini LLM → Analyzes query & generates response
    ↓
├── 90% Index-only → Returns chart config immediately
└── 10% Needs shards → Returns query plan + chart template
                            ↓
                    Server fetches shards → Processes data → Returns chart
                            ↓
                    Frontend renders with Recharts
```

## Features

### Index-Based Queries (Fast)
These queries use pre-aggregated data and return instantly:
- "Show monthly ridership for 2023"
- "Compare e-bike vs classic bike usage"
- "What were the peak hours in summer?"
- "Most popular stations in June"

### Shard-Based Queries (Detailed)
These queries process raw trip data for custom analysis:
- "Busiest stations in the afternoon of April 1"
- "Average trip duration by hour on February 10"
- "Round trips on weekends in March"
- "Trips longer than 60 minutes in July"

### Query Processor Operations

The LLM generates structured query plans that the server executes:

**Calculate**: Derive new fields
- `duration_minutes` - Trip duration from timestamps
- `hour_of_day` - Hour (0-23) from timestamp
- `is_round_trip` - Same start/end station
- `day_of_week` - Day name from date

**Filter**: Multiple filter types
- `equals`, `greater_than`, `less_than`, `contains`
- `hour_between` - Time range filtering
- `day_of_week` - Filter by day

**Aggregate**: Group and summarize
- `count`, `sum`, `avg`, `min`, `max`

**Sort & Limit**: Order results and get top N

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### Running the App

```bash
# Development server
npm run dev

# Open http://localhost:3000
```

### Data Conversion (Optional)

The pre-processed data is already available on GitHub. If you want to reprocess:

```bash
# Convert CSV files to JSON shards
node convert-v2.js

# This will:
# 1. Process all CSV files in source-data/csvs/
# 2. Shard by day (one file per date)
# 3. Generate index.json with daily summaries
# 4. Output to output/shards/ and output/index.json
```

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **Recharts** - Chart rendering
- **Tailwind CSS** - Styling

### Backend
- **Next.js API Routes**
- **Google Gemini AI** (gemini-2.5-pro) - Query planning & analysis
- **Node.js** - Data processing

### Data Processing
- **csv-parse** - CSV to JSON conversion
- Custom query processor for filtering, aggregation, and transformations

## Project Structure

```
citibike-opendata-analysis/
├── src/
│   ├── app/
│   │   ├── api/query/route.ts     # LLM API endpoint
│   │   ├── page.tsx                # Main UI
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ChartRenderer.tsx       # Recharts wrapper
│   │   └── QueryInput.tsx          # Query input UI
│   └── lib/
│       └── queryProcessor.ts       # Shard data processing
├── output/
│   ├── index.json                  # Pre-aggregated daily summaries
│   └── shards/                     # Daily trip data
│       ├── 2023-01/
│       ├── 2023-02/
│       └── ...
└── source-data/
    └── csvs/                       # Original CSV files
```

## Data Sources

- **Original Data**: NYC Citibike trip data (2023)
- **Hosted Shards**: GitHub Pages ([jeffreyhshapiro/citibike-data-sharded](https://github.com/jeffreyhshapiro/citibike-data-sharded))

## How It Works

### 1. LLM Query Planning

When you ask a question, Google Gemini:
- Determines if it needs index data or shard data
- For shard queries, generates a structured query plan
- Returns a Recharts-compatible chart configuration

### 2. Server-Side Processing

For shard queries, the server:
- Fetches requested daily shards from CDN
- Applies query plan (calculate → filter → group → aggregate → sort → limit)
- Returns processed data merged with chart config

### 3. Chart Rendering

The frontend receives a complete chart configuration and renders it with Recharts.

## Example Query Plans

**Query**: "Busiest stations in the afternoon of April 1"

**LLM Response**:
```json
{
  "needsShards": true,
  "shardsToFetch": [".../shards/2023-04/2023-04-01.json"],
  "queryPlan": {
    "calculate": [{"name": "hour", "operation": "hour_of_day"}],
    "filters": [{"field": "hour", "operation": "hour_between", "value": [12, 18]}],
    "groupBy": "start_station_name",
    "aggregate": {"operation": "count", "field": "*"},
    "orderBy": {"field": "count", "direction": "desc"},
    "limit": 10
  },
  "chartConfig": {
    "type": "BarChart",
    "title": "Busiest Stations (Afternoon of April 1, 2023)",
    "xAxis": {"dataKey": "start_station_name", "label": "Station"},
    "yAxis": {"label": "Trips"},
    "bars": [{"dataKey": "count", "fill": "#8884d8"}]
  }
}
```

**Server Processing**:
1. Fetches 15,423 trips from April 1 shard
2. Calculates hour for each trip
3. Filters to 12pm-6pm: 5,234 trips
4. Groups by station name
5. Counts trips per station
6. Sorts descending, takes top 10
7. Returns chart with 10 stations

## Performance

- **Index queries**: < 1 second (no data loading)
- **Shard queries**: 2-5 seconds (includes CDN fetch + processing)
- **Memory usage**: ~50MB per 10K trip shard
- **Data size reduction**: 95% (10GB CSV → 500MB JSON)

## Environment Variables

```bash
# Required
GEMINI_API_KEY=your_api_key_here
```

## Contributing

This is a proof-of-concept project. Contributions, issues, and feature requests are welcome!

## License

ISC

## Acknowledgments

- NYC Citibike for open data
- Google Gemini for AI capabilities
- Recharts for visualization library
