"use client";

import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { colors } from "@/lib/chart-colors";

type SentimentLineData = Array<{
  dateMilli: number;
  valence: number;
  valenceAvg7: number | undefined;
}>;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

const getMonthlyTicks = (data: SentimentLineData): number[] => {
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

export const SentimentLineChart: React.FC<{ data: SentimentLineData }> = ({
  data,
}) => {
  const chartData = data.map((row) => {
    if (typeof row.valenceAvg7 !== "number") {
      return {
        ...row,
        avgAboveZero: 0,
        avgBelowZero: 0,
      };
    }

    return {
      ...row,
      avgAboveZero: row.valenceAvg7 >= 0 ? row.valenceAvg7 : 0,
      avgBelowZero: row.valenceAvg7 < 0 ? row.valenceAvg7 : 0,
    };
  });

  return (
    <div className="flex space-x-1 flex-wrap space-y-1 overflow-x-scroll">
      <ComposedChart
        style={{
          width: "100%",
          height: "100%",
          maxHeight: 360,
          aspectRatio: 1.618,
        }}
        responsive
        data={chartData}
        margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
      >
        <XAxis
          dataKey="dateMilli"
          type="number"
          height={50}
          angle={-90}
          tick={{ fontSize: 12, fill: "var(--chart-label)" }}
          domain={["dataMin", "dataMax"]}
          scale="time"
          ticks={getMonthlyTicks(data)}
          tickFormatter={(dateMilli) => dateFormatter.format(dateMilli)}
        />

        <YAxis
          width="auto"
          type="number"
          domain={[-1, 1]}
          includeHidden
          scale="linear"
          tick={{ fill: "var(--chart-label)" }}
        />

        <ReferenceLine
          y={0}
          stroke={colors.gray}
          strokeWidth={1.5}
          ifOverflow="extendDomain"
        />

        <Tooltip
          labelFormatter={(dateMilli) => dateFormatter.format(dateMilli)}
          contentStyle={{
            backgroundColor: "var(--chart-tooltip-bg)",
            borderColor: "var(--chart-tooltip-border)",
            color: "var(--chart-tooltip-text)",
            borderRadius: 8,
          }}
          labelStyle={{ color: "var(--chart-tooltip-text)" }}
          itemStyle={{ color: "var(--chart-tooltip-text)" }}
        />

        <Area
          dataKey="avgAboveZero"
          name="Sentiment (7d avg)"
          type="monotone"
          stroke="transparent"
          fill={colors.green}
          fillOpacity={0.25}
          baseValue={0}
          isAnimationActive={false}
        />

        <Area
          dataKey="avgBelowZero"
          name="Sentiment (7d avg)"
          type="monotone"
          stroke="transparent"
          fill={colors.red}
          fillOpacity={0.25}
          baseValue={0}
          isAnimationActive={false}
        />

        <Line
          dataKey="valence"
          stroke={colors.blue}
          dot={{ r: 2, fill: colors.blue }}
          name="Sentiment valence"
          isAnimationActive={false}
        />
      </ComposedChart>
    </div>
  );
};
