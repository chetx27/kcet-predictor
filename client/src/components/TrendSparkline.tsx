import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { TrendDirection } from '../../../shared/types';

interface TrendSparklineProps {
  data: { year: number; value: number }[];
  trend: TrendDirection;
  width?: number;
  height?: number;
}

const trendColors: Record<TrendDirection, string> = {
  improving: '#34D399',
  stable: '#8B8FA3',
  tightening: '#F87171',
};

export function TrendSparkline({ data, trend, width = 80, height = 32 }: TrendSparklineProps) {
  if (data.length === 0) return null;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={trendColors[trend]}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
