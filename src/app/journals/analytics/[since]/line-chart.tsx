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

export const LineChart: React.FC<{
  data: LineChartData;
  dataKey: string;
  averageKey: AverageKey;
  name: string;
}> = ({ data, dataKey, averageKey: averageKey, name }) => {
  const chartData = data.map((row) => {
    const value = row[averageKey];

    if (typeof value !== "number") {
      return {
        ...row,
        avgAbove: 3,
        avgBelow: 3,
      };
    }

    return {
      ...row,
      avgAbove: value >= 3 ? value : 3,
      avgBelow: value < 3 ? value : 3,
    };
  });

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
        data={chartData}
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

        <Area
          dataKey="avgAbove"
          name={`${name} (7d avg)`}
          type="monotone"
          stroke="transparent"
          fill={colors.green}
          fillOpacity={0.25}
          baseValue={3}
          isAnimationActive={false}
        />

        <Area
          dataKey="avgBelow"
          name={`${name} (7d avg)`}
          type="monotone"
          stroke="transparent"
          fill={colors.red}
          fillOpacity={0.25}
          baseValue={3}
          isAnimationActive={false}
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
