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
import { colors } from "@/lib/chart-colors";

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
    return colors.gray;
  }

  if (value <= 2) {
    return colors.red;
  }

  if (value === 3) {
    return colors.orange;
  }

  return colors.green;
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

const gradientOffset = (): number => {
  const min = 1;
  const max = 5;
  const threshold = 3;
  const offset = (max - threshold) / (max - min);

  return Math.min(1, Math.max(0, offset));
};

const off = gradientOffset();

export const LineChart: React.FC<{
  data: LineChartData;
  dataKey: string;
  averageKey: AverageKey;
  name: string;
}> = ({ data, dataKey, averageKey: averageKey, name }) => {
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
          stroke={colors.orange}
          strokeWidth={1.5}
          ifOverflow="extendDomain"
        />

        <Tooltip
          labelFormatter={(dateMilli) => dateFormatter.format(dateMilli)}
        />

        <Legend />

        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22C55E" stopOpacity={0.25} />
            <stop offset={off} stopColor="#22C55E" stopOpacity={0.25} />
            <stop offset={off} stopColor="#EF4444" stopOpacity={0.25} />
            <stop offset="1" stopColor="#EF4444" stopOpacity={0.25} />
          </linearGradient>
        </defs>

        <Area
          dataKey={averageKey}
          name={`${name} (7d avg)`}
          type="monotone"
          stroke={colors.gray}
          fill={`url(#${gradientId})`}
          baseValue={3}
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
