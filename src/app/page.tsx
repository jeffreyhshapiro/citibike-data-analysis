'use client';

import { useState } from 'react';
import QueryInput from '@/components/QueryInput';
import ChartRenderer from '@/components/ChartRenderer';

// Mock chart configs for testing (before LLM integration)
const mockChartConfigs: Record<string, any> = {
  'monthly ridership': {
    type: 'LineChart',
    title: 'Monthly Ridership 2023',
    description: 'Total trips per month showing seasonal trends',
    data: [
      { month: '2023-01', trips: 1523891 },
      { month: '2023-02', trips: 1387234 },
      { month: '2023-03', trips: 2145678 },
      { month: '2023-04', trips: 2876543 },
      { month: '2023-05', trips: 3234567 },
      { month: '2023-06', trips: 3567890 },
      { month: '2023-07', trips: 3789012 },
      { month: '2023-08', trips: 3654321 },
      { month: '2023-09', trips: 3456789 },
      { month: '2023-10', trips: 2987654 },
      { month: '2023-11', trips: 2234567 },
      { month: '2023-12', trips: 1876543 },
    ],
    xAxis: { dataKey: 'month', label: 'Month' },
    yAxis: { label: 'Total Trips' },
    lines: [
      { dataKey: 'trips', stroke: '#8884d8', name: 'Trips' }
    ]
  },
  'e-bike': {
    type: 'AreaChart',
    title: 'E-Bike vs Classic Bike Usage 2023',
    description: 'Monthly bike type distribution showing e-bike adoption',
    data: [
      { month: '2023-01', classic: 850000, electric: 673891 },
      { month: '2023-02', classic: 750000, electric: 637234 },
      { month: '2023-03', classic: 1100000, electric: 1045678 },
      { month: '2023-04', classic: 1400000, electric: 1476543 },
      { month: '2023-05', classic: 1500000, electric: 1734567 },
      { month: '2023-06', classic: 1600000, electric: 1967890 },
      { month: '2023-07', classic: 1650000, electric: 2139012 },
      { month: '2023-08', classic: 1600000, electric: 2054321 },
      { month: '2023-09', classic: 1500000, electric: 1956789 },
      { month: '2023-10', classic: 1300000, electric: 1687654 },
      { month: '2023-11', classic: 1000000, electric: 1234567 },
      { month: '2023-12', classic: 850000, electric: 1026543 },
    ],
    xAxis: { dataKey: 'month', label: 'Month' },
    yAxis: { label: 'Trips' },
    areas: [
      { dataKey: 'classic', stackId: '1', stroke: '#8884d8', fill: '#8884d8', name: 'Classic Bike' },
      { dataKey: 'electric', stackId: '1', stroke: '#82ca9d', fill: '#82ca9d', name: 'E-Bike' }
    ]
  },
  'peak hours': {
    type: 'BarChart',
    title: 'Peak Hours: Winter vs Summer',
    description: 'Hourly trip distribution comparing winter (Dec-Feb) and summer (Jun-Aug)',
    data: [
      { hour: '00:00', winter: 12500, summer: 18900 },
      { hour: '01:00', winter: 8200, summer: 15300 },
      { hour: '02:00', winter: 5100, summer: 11200 },
      { hour: '03:00', winter: 3800, summer: 8900 },
      { hour: '04:00', winter: 4200, summer: 10500 },
      { hour: '05:00', winter: 12000, summer: 18000 },
      { hour: '06:00', winter: 45000, summer: 55000 },
      { hour: '07:00', winter: 95000, summer: 88000 },
      { hour: '08:00', winter: 125000, summer: 105000 },
      { hour: '09:00', winter: 98000, summer: 92000 },
      { hour: '10:00', winter: 75000, summer: 85000 },
      { hour: '11:00', winter: 72000, summer: 88000 },
      { hour: '12:00', winter: 85000, summer: 95000 },
      { hour: '13:00', winter: 82000, summer: 92000 },
      { hour: '14:00', winter: 78000, summer: 89000 },
      { hour: '15:00', winter: 85000, summer: 95000 },
      { hour: '16:00', winter: 98000, summer: 108000 },
      { hour: '17:00', winter: 135000, summer: 125000 },
      { hour: '18:00', winter: 145000, summer: 135000 },
      { hour: '19:00', winter: 105000, summer: 115000 },
      { hour: '20:00', winter: 75000, summer: 95000 },
      { hour: '21:00', winter: 55000, summer: 78000 },
      { hour: '22:00', winter: 38000, summer: 58000 },
      { hour: '23:00', winter: 22000, summer: 35000 },
    ],
    xAxis: { dataKey: 'hour', label: 'Hour of Day' },
    yAxis: { label: 'Trip Count' },
    bars: [
      { dataKey: 'winter', fill: '#8884d8', name: 'Winter' },
      { dataKey: 'summer', fill: '#ffc658', name: 'Summer' }
    ]
  },
  'stations': {
    type: 'BarChart',
    title: 'Top 10 Starting Stations in June 2023',
    description: 'Most popular departure stations',
    data: [
      { station: 'E 1 St & Bowery', trips: 25430 },
      { station: '1 Ave & E 39 St', trips: 22150 },
      { station: 'W 21 St & 6 Ave', trips: 21890 },
      { station: 'Broadway & E 14 St', trips: 20567 },
      { station: 'Central Park S & 6 Ave', trips: 19876 },
      { station: 'W 31 St & 7 Ave', trips: 18934 },
      { station: 'Lafayette St & E 8 St', trips: 18123 },
      { station: 'Broadway & W 60 St', trips: 17456 },
      { station: 'W 41 St & 8 Ave', trips: 16789 },
      { station: 'E 17 St & Broadway', trips: 15987 },
    ],
    xAxis: { dataKey: 'station', label: 'Station' },
    yAxis: { label: 'Trips' },
    bars: [
      { dataKey: 'trips', fill: '#8884d8', name: 'Trips' }
    ]
  }
};

export default function Home() {
  const [chartConfig, setChartConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (prompt: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate chart');
      }

      const config = await response.json();
      setChartConfig(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the chart');
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: '#E5E5DB' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-black mb-4">
            Citibike Data Analyzer
          </h1>
          <p className="text-xl text-black">
            Ask questions about 2023 Citibike trip data in natural language
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Powered by Google Gemini AI
          </p>
        </div>

        {/* Query Input */}
        <div className="flex justify-center mb-8">
          <QueryInput onSubmit={handleQuery} loading={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-100 border-2 border-red-800 rounded-lg text-red-900 font-medium">
            {error}
          </div>
        )}

        {/* Chart Display */}
        {chartConfig && (
          <div className="max-w-5xl mx-auto">
            <ChartRenderer config={chartConfig} />
          </div>
        )}

        {/* Info Box */}
        {!chartConfig && !loading && (
          <div className="max-w-3xl mx-auto mt-12 p-6 bg-white border-2 border-black rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-black">How it works</h3>
            <ul className="space-y-2 text-black">
              <li>✅ Type a question about Citibike data</li>
              <li>✅ AI analyzes and generates charts in real-time</li>
              <li>✅ Data covers all of 2023 NYC Citibike trips</li>
              <li>✅ Powered by Google Gemini with pre-aggregated data</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
