'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ChartConfig {
  type: 'LineChart' | 'BarChart' | 'AreaChart' | 'PieChart';
  title: string;
  description?: string;
  data: any[];
  xAxis?: {
    dataKey: string;
    label?: string;
  };
  yAxis?: {
    label?: string;
  };
  lines?: Array<{
    dataKey: string;
    stroke?: string;
    name?: string;
  }>;
  bars?: Array<{
    dataKey: string;
    fill?: string;
    name?: string;
  }>;
  areas?: Array<{
    dataKey: string;
    stroke?: string;
    fill?: string;
    name?: string;
    stackId?: string;
  }>;
  pie?: {
    dataKey: string;
    nameKey: string;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

export default function ChartRenderer({ config }: { config: ChartConfig }) {
  return (
    <div className="w-full bg-white rounded-lg border-2 border-black shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-2 text-black">{config.title}</h2>
      {config.description && (
        <p className="text-black mb-4">{config.description}</p>
      )}

      <ResponsiveContainer width="100%" height={400}>
        {config.type === 'LineChart' && (
          <LineChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={config.xAxis?.dataKey || 'x'}
              label={config.xAxis?.label ? { value: config.xAxis.label, position: 'insideBottom', offset: -5 } : undefined}
            />
            <YAxis
              label={config.yAxis?.label ? { value: config.yAxis.label, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip />
            <Legend />
            {config.lines?.map((line, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke || COLORS[i % COLORS.length]}
                name={line.name}
              />
            ))}
          </LineChart>
        )}

        {config.type === 'BarChart' && (
          <BarChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={config.xAxis?.dataKey || 'x'}
              label={config.xAxis?.label ? { value: config.xAxis.label, position: 'insideBottom', offset: -5 } : undefined}
            />
            <YAxis
              label={config.yAxis?.label ? { value: config.yAxis.label, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip />
            <Legend />
            {config.bars?.map((bar, i) => (
              <Bar
                key={i}
                dataKey={bar.dataKey}
                fill={bar.fill || COLORS[i % COLORS.length]}
                name={bar.name}
              />
            ))}
          </BarChart>
        )}

        {config.type === 'AreaChart' && (
          <AreaChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={config.xAxis?.dataKey || 'x'}
              label={config.xAxis?.label ? { value: config.xAxis.label, position: 'insideBottom', offset: -5 } : undefined}
            />
            <YAxis
              label={config.yAxis?.label ? { value: config.yAxis.label, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip />
            <Legend />
            {config.areas?.map((area, i) => (
              <Area
                key={i}
                type="monotone"
                dataKey={area.dataKey}
                stroke={area.stroke || COLORS[i % COLORS.length]}
                fill={area.fill || COLORS[i % COLORS.length]}
                name={area.name}
                stackId={area.stackId}
              />
            ))}
          </AreaChart>
        )}

        {config.type === 'PieChart' && config.pie && (
          <PieChart>
            <Pie
              data={config.data}
              dataKey={config.pie.dataKey}
              nameKey={config.pie.nameKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {config.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
