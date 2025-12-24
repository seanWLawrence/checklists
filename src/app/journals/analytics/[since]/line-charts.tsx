"use client";

import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  LineChart as LineChartBase,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { LineChartData } from "../../lib/get-line-chart-data.lib";
import { colors } from "@/lib/chart-colors";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace("#", "");
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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

const LineChart: React.FC<{
  data: LineChartData;
  dataKey: string;
  avgKey: string;
  name: string;
  color: string;
}> = ({ data, dataKey, avgKey, name, color }) => {
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex space-x-1 flex-wrap space-y-1 overflow-x-scroll">
      <LineChartBase
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

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
          stroke="#999"
          strokeDasharray="3 3"
          ifOverflow="extendDomain"
        />

        <Tooltip
          labelFormatter={(dateMilli) => dateFormatter.format(dateMilli)}
        />

        <Legend />

        <Area
          dataKey={avgKey}
          name={`${name} (7d avg)`}
          stroke="none"
          fill={hexToRgba(color, 0.15)}
          fillOpacity={0.15}
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
        <Line
          dataKey={avgKey}
          stroke="transparent"
          dot={({ cx, cy, value }) => (
            <circle
              cx={cx}
              cy={cy}
              r={3}
              fill={getDotColor(value as number | undefined)}
            />
          )}
          name={`${name} (7d avg)`}
          isAnimationActive={false}
        />
      </LineChartBase>
    </div>
  );
};

const LineCharts: React.FC<{ data: LineChartData }> = ({ data }) => {
  return (
    <div className="flex flex-col space-y-2">
      <LineChart
        data={data}
        dataKey="energyLevel"
        avgKey="energyLevelAvg7"
        name="Energy"
        color={colors.blue}
      />
      <LineChart
        data={data}
        dataKey="moodLevel"
        avgKey="moodLevelAvg7"
        name="Mood"
        color={colors.fuschia}
      />
      <LineChart
        data={data}
        dataKey="healthLevel"
        avgKey="healthLevelAvg7"
        name="Health"
        color={colors.teal}
      />
      <LineChart
        data={data}
        dataKey="creativityLevel"
        avgKey="creativityLevelAvg7"
        name="Creativity"
        color={colors.coral}
      />
      <LineChart
        data={data}
        dataKey="relationshipsLevel"
        avgKey="relationshipsLevelAvg7"
        name="Relationships"
        color={colors.purple}
      />
    </div>
  );
};

export default LineCharts;
