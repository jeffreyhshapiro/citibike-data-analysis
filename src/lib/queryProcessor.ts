/**
 * Query Processor for Citibike Shard Data
 *
 * Processes trip data based on LLM-generated query plans
 */

export interface QueryPlan {
  filters?: Array<{
    field: string;
    operation: 'equals' | 'hour_between' | 'greater_than' | 'less_than' | 'contains' | 'day_of_week';
    value: any;
  }>;
  calculate?: Array<{
    name: string;
    operation: 'duration_minutes' | 'hour_of_day' | 'is_round_trip' | 'day_of_week';
  }>;
  groupBy?: string;
  aggregate?: {
    operation: 'count' | 'sum' | 'avg' | 'min' | 'max';
    field: string;
  };
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

interface Trip {
  ride_id: string;
  rideable_type: 'classic_bike' | 'electric_bike';
  started_at: string;
  ended_at: string;
  start_station_name: string;
  start_station_id: string;
  end_station_name: string;
  end_station_id: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  member_casual: 'member' | 'casual';
}

/**
 * Process shard data according to a query plan
 */
export function processShardData(trips: Trip[], queryPlan: QueryPlan): any[] {
  let data: any[] = [...trips];

  console.log(`[QueryProcessor] Starting with ${data.length} trips`);

  // Step 1: Calculate derived fields
  if (queryPlan.calculate) {
    console.log(`[QueryProcessor] Calculating derived fields:`, queryPlan.calculate.map(c => c.operation));

    data = data.map(trip => {
      const calculated = { ...trip };

      queryPlan.calculate?.forEach(calc => {
        switch (calc.operation) {
          case 'duration_minutes':
            const start = new Date(trip.started_at);
            const end = new Date(trip.ended_at);
            calculated[calc.name] = Math.round((end.getTime() - start.getTime()) / 60000);
            break;

          case 'hour_of_day':
            calculated[calc.name] = parseInt(trip.started_at.split(' ')[1].split(':')[0]);
            break;

          case 'is_round_trip':
            calculated[calc.name] = trip.start_station_id === trip.end_station_id;
            break;

          case 'day_of_week':
            const date = new Date(trip.started_at);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            calculated[calc.name] = days[date.getDay()];
            break;
        }
      });

      return calculated;
    });
  }

  // Step 2: Apply filters
  if (queryPlan.filters) {
    console.log(`[QueryProcessor] Applying ${queryPlan.filters.length} filters`);

    data = data.filter(trip => {
      return queryPlan.filters!.every(filter => {
        let value = trip[filter.field];

        switch (filter.operation) {
          case 'equals':
            return value === filter.value;

          case 'hour_between':
            const hour = parseInt(trip.started_at.split(' ')[1].split(':')[0]);
            return hour >= filter.value[0] && hour < filter.value[1];

          case 'greater_than':
            return value > filter.value;

          case 'less_than':
            return value < filter.value;

          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());

          case 'day_of_week':
            const date = new Date(trip.started_at);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return days[date.getDay()] === filter.value;

          default:
            console.warn(`Unknown filter operation: ${filter.operation}`);
            return true;
        }
      });
    });

    console.log(`[QueryProcessor] After filtering: ${data.length} trips`);
  }

  // Step 3: Group and aggregate
  if (queryPlan.groupBy) {
    console.log(`[QueryProcessor] Grouping by: ${queryPlan.groupBy}`);

    const grouped: Record<string, any> = {};

    data.forEach(trip => {
      const key = String(trip[queryPlan.groupBy!]);
      if (!grouped[key]) {
        grouped[key] = {
          [queryPlan.groupBy!]: key,
          count: 0,
          items: []
        };
      }
      grouped[key].count++;
      grouped[key].items.push(trip);
    });

    console.log(`[QueryProcessor] Created ${Object.keys(grouped).length} groups`);

    // Apply aggregation
    data = Object.values(grouped).map(group => {
      const result: any = { [queryPlan.groupBy!]: group[queryPlan.groupBy!] };

      if (queryPlan.aggregate) {
        const field = queryPlan.aggregate.field;

        switch (queryPlan.aggregate.operation) {
          case 'count':
            result.count = group.count;
            break;

          case 'sum':
            result.sum = group.items.reduce((acc: number, item: any) =>
              acc + (Number(item[field]) || 0), 0);
            break;

          case 'avg':
            const sum = group.items.reduce((acc: number, item: any) =>
              acc + (Number(item[field]) || 0), 0);
            result.avg = Math.round(sum / group.count);
            break;

          case 'min':
            result.min = Math.min(...group.items.map((item: any) => Number(item[field]) || Infinity));
            break;

          case 'max':
            result.max = Math.max(...group.items.map((item: any) => Number(item[field]) || -Infinity));
            break;
        }
      }

      return result;
    });

    console.log(`[QueryProcessor] After aggregation: ${data.length} groups`);
  }

  // Step 4: Sort
  if (queryPlan.orderBy) {
    console.log(`[QueryProcessor] Sorting by: ${queryPlan.orderBy.field} ${queryPlan.orderBy.direction}`);

    data.sort((a, b) => {
      const aVal = Number(a[queryPlan.orderBy!.field]) || 0;
      const bVal = Number(b[queryPlan.orderBy!.field]) || 0;
      const direction = queryPlan.orderBy!.direction === 'asc' ? 1 : -1;
      return (aVal - bVal) * direction;
    });
  }

  // Step 5: Limit
  if (queryPlan.limit) {
    console.log(`[QueryProcessor] Limiting to top ${queryPlan.limit}`);
    data = data.slice(0, queryPlan.limit);
  }

  console.log(`[QueryProcessor] Final result: ${data.length} records`);
  console.log(`[QueryProcessor] Sample:`, data[0]);

  return data;
}
