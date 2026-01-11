"use client";

import {
  Legend,
  RadarChart as RadarChartBase,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { colors } from "@/lib/chart-colors";
import { RadarChartData } from "../../journal.types";

const opacity = 0.5;

export const RadarChart: React.FC<{
  data: RadarChartData;
}> = ({ data }) => {
  if (
    !data ||
    data.length === 0 ||
    data.some(
      (entry) =>
        !entry.average ||
        !entry.median ||
        !entry.mode ||
        !entry.eightiethPercentile ||
        !entry.twentiethPercentile,
    )
  ) {
    return <p className="py-20">No data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300} minWidth={300}>
      <RadarChartBase data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" tick={{ fill: "var(--chart-label)" }} />
        <PolarRadiusAxis
          domain={[0, "dataMax"]}
          axisLine={false}
          tick={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--chart-tooltip-bg)",
            borderColor: "var(--chart-tooltip-border)",
            color: "var(--chart-tooltip-text)",
            borderRadius: 8,
          }}
          labelStyle={{ color: "var(--chart-label-muted)" }}
          itemStyle={{ color: "var(--chart-tooltip-text)" }}
        />
        <Radar
          name="Median"
          dataKey="median"
          stroke={colors.blue}
          fill={colors.blue}
          fillOpacity={opacity}
        />
        <Radar
          name="Mode"
          dataKey="mode"
          stroke={colors.purple}
          fill={colors.purple}
          fillOpacity={opacity}
        />
        <Radar
          name="80th percentile"
          dataKey="eightiethPercentile"
          stroke={colors.fuschia}
          fill={colors.fuschia}
          fillOpacity={opacity}
        />
        <Radar
          name="20th percentile"
          dataKey="twentiethPercentile"
          stroke={colors.coral}
          fill={colors.coral}
          fillOpacity={opacity}
        />
        <Radar
          name="Average"
          dataKey="average"
          stroke={colors.teal}
          fill={colors.teal}
          fillOpacity={opacity}
        />
        <Legend />
      </RadarChartBase>
    </ResponsiveContainer>
  );
};
