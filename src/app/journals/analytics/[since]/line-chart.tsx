"use client";

import {
  Area,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LineChartData } from "../../lib/get-line-chart-data.lib";

export type AverageKey =
  | "energyLevelAvg7"
  | "moodLevelAvg7"
  | "healthLevelAvg7"
  | "creativityLevelAvg7"
  | "relationshipsLevelAvg7";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

const getDotColor = (value?: number): string => {
  if (value === undefined) {
    return "#A1A1AA";
  }

  if (value <= 2) {
    return "#EF4444";
  }

  if (value === 3) {
    return "#F59E0B";
  }

  return "#22C55E";
};

const getMonthlyTicks = (data: LineChartData): number[] => {
  const seen = new Set<string>();
  const ticks: number[] = [];

  for (const row of data) {
    const date = new Date(row.dateMilli);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (!seen.has(key)) {
      seen.add(key);
      ticks.push(new Date(date.getFullYear(), date.getMonth(), 1).getTime());
    }
  }

  return ticks;
};

const gradientOffset = ({}: { averageKey: AverageKey }): number => {
  const min = 1;
  const max = 5;
  const threshold = 3;
  const offset = (max - threshold) / (max - min);

  return Math.min(1, Math.max(0, offset));
};

export const LineChart: React.FC<{
  data: LineChartData;
  dataKey: string;
  averageKey: AverageKey;
  name: string;
}> = ({ data, dataKey, averageKey: averageKey, name }) => {
  const off = gradientOffset({ averageKey });
  const gradientId = `splitColor-${averageKey}`;

  return (
    <div className="flex space-x-1 flex-wrap space-y-1 overflow-x-scroll">
      <ComposedChart
        style={{
          width: "100%",
          height: "100%",
          maxHeight: 400,
          aspectRatio: 1.618,
        }}
        responsive
        data={data}
        margin={{
          top: 5,
          right: 0,
          left: 0,
          bottom: 5,
        }}
      >
        <XAxis
          dataKey="dateMilli"
          name="Date"
          angle={-90}
          type="number"
          height={50}
          tick={{ fontSize: 12 }}
          domain={["dataMin", "dataMax"]}
          scale="time"
          ticks={getMonthlyTicks(data)}
          tickFormatter={(dateMilli) => dateFormatter.format(dateMilli)}
        />

        <YAxis
          width="auto"
          interval="preserveStartEnd"
          type="number"
          domain={[1, 5]}
          includeHidden
          scale="linear"
        />

        <ReferenceLine
          y={3}
          stroke={"orange"}
          strokeWidth={1.5}
          ifOverflow="extendDomain"
        />

        <Tooltip
          labelFormatter={(dateMilli) => dateFormatter.format(dateMilli)}
        />

        <Legend />

        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="green" stopOpacity={1} />
            <stop offset={off} stopColor="green" stopOpacity={0.1} />
            <stop offset={off} stopColor="red" stopOpacity={0.1} />
            <stop offset="1" stopColor="red" stopOpacity={1} />
          </linearGradient>
        </defs>

        <Area
          dataKey={averageKey}
          name={`${name} (7d avg)`}
          type="monotone"
          stroke="#555"
          fill={`url(#${gradientId})`}
        />

        <Line
          dataKey={dataKey}
          stroke="transparent"
          dot={({ cx, cy, value }) => (
            <circle
              cx={cx}
              cy={cy}
              r={3}
              fill={getDotColor(value as number | undefined)}
            />
          )}
          name={name}
          isAnimationActive={false}
        />
      </ComposedChart>
    </div>
  );
};
