/**
 * Index Processor for Citibike Index Data
 *
 * Processes the index.json file which contains daily aggregates
 */

export interface IndexDayData {
  trip_count: number;
  member_trips: number;
  casual_trips: number;
  bike_types: {
    classic: number;
    electric: number;
  };
  peak_hour: number;
  hourly_distribution: number[];
  top_start_stations: Array<{
    name: string;
    count: number;
  }>;
  top_end_stations: Array<{
    name: string;
    count: number;
  }>;
  top_routes: Array<{
    from: string;
    to: string;
    count: number;
  }>;
  bounding_box: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface IndexData {
  [date: string]: IndexDayData;
}

export interface IndexProcessingPlan {
  dateRange?: {
    start: string;
    end: string;
  };
  aggregateBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  fields?: string[];
  transform?: string;
}

/**
 * Process index data according to a processing plan
 */
export function processIndexData(indexData: IndexData, plan: IndexProcessingPlan): any[] {
  console.log('[IndexProcessor] Starting processing');
  console.log('[IndexProcessor] Plan:', JSON.stringify(plan, null, 2));

  // Step 1: Filter by date range
  let dates = Object.keys(indexData).sort();

  if (plan.dateRange) {
    dates = dates.filter(date =>
      date >= plan.dateRange!.start && date <= plan.dateRange!.end
    );
  }

  console.log(`[IndexProcessor] Processing ${dates.length} days`);

  // Step 2: Group by aggregation period
  const grouped: Record<string, IndexDayData[]> = {};

  dates.forEach(date => {
    const key = getAggregationKey(date, plan.aggregateBy || 'day');
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(indexData[date]);
  });

  console.log(`[IndexProcessor] Created ${Object.keys(grouped).length} groups`);

  // Step 3: Apply transformation
  const result = Object.entries(grouped).map(([key, days]) => {
    return transformGroup(key, days, plan);
  });

  console.log(`[IndexProcessor] Final result: ${result.length} records`);
  console.log(`[IndexProcessor] Sample:`, result[0]);

  return result;
}

/**
 * Get aggregation key for a date based on period
 */
function getAggregationKey(date: string, period: string): string {
  const [year, month, day] = date.split('-');

  switch (period) {
    case 'day':
      return date;
    case 'week':
      const d = new Date(date);
      const weekNum = getWeekNumber(d);
      return `${year}-W${String(weekNum).padStart(2, '0')}`;
    case 'month':
      return `${year}-${month}`;
    case 'quarter':
      const q = Math.ceil(parseInt(month) / 3);
      return `${year}-Q${q}`;
    case 'year':
      return year;
    default:
      return date;
  }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Transform a group of days into aggregated result
 */
function transformGroup(key: string, days: IndexDayData[], plan: IndexProcessingPlan): any {
  const result: any = { period: key };

  // Sum trip counts
  result.trip_count = days.reduce((sum, day) => sum + day.trip_count, 0);
  result.member_trips = days.reduce((sum, day) => sum + day.member_trips, 0);
  result.casual_trips = days.reduce((sum, day) => sum + day.casual_trips, 0);

  // Sum bike types
  result.classic_bikes = days.reduce((sum, day) => sum + day.bike_types.classic, 0);
  result.electric_bikes = days.reduce((sum, day) => sum + day.bike_types.electric, 0);

  // Aggregate hourly distribution
  result.hourly_distribution = Array(24).fill(0);
  days.forEach(day => {
    day.hourly_distribution.forEach((count, hour) => {
      result.hourly_distribution[hour] += count;
    });
  });

  // Find peak hour across the period
  const maxHourIndex = result.hourly_distribution.indexOf(
    Math.max(...result.hourly_distribution)
  );
  result.peak_hour = maxHourIndex;

  // Aggregate top stations
  const startStationCounts: Record<string, number> = {};
  const endStationCounts: Record<string, number> = {};
  const routeCounts: Record<string, number> = {};

  days.forEach(day => {
    day.top_start_stations.forEach(station => {
      startStationCounts[station.name] = (startStationCounts[station.name] || 0) + station.count;
    });
    day.top_end_stations.forEach(station => {
      endStationCounts[station.name] = (endStationCounts[station.name] || 0) + station.count;
    });
    day.top_routes.forEach(route => {
      const key = `${route.from}→${route.to}`;
      routeCounts[key] = (routeCounts[key] || 0) + route.count;
    });
  });

  result.top_start_stations = Object.entries(startStationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  result.top_end_stations = Object.entries(endStationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  result.top_routes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [from, to] = key.split('→');
      return { from, to, count };
    });

  // Calculate bounding box
  result.bounding_box = {
    north: Math.max(...days.map(d => d.bounding_box.north)),
    south: Math.min(...days.map(d => d.bounding_box.south)),
    east: Math.max(...days.map(d => d.bounding_box.east)),
    west: Math.min(...days.map(d => d.bounding_box.west))
  };

  // Filter to requested fields if specified
  if (plan.fields && plan.fields.length > 0) {
    const filtered: any = { period: result.period };
    plan.fields.forEach(field => {
      if (result[field] !== undefined) {
        filtered[field] = result[field];
      }
    });
    return filtered;
  }

  return result;
}
