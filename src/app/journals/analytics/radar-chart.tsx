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
import { RadarChartData } from "../journal.model";
import { colors } from "@/lib/chart-colors";

const opacity = 0.5;

export const RadarChart: React.FC<{
  data: RadarChartData;
}> = ({ data }) => {
  return (
    <ResponsiveContainer width={"100%"} height={450}>
      <RadarChartBase outerRadius={90} width={400} height={400} data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis
          domain={[0, "dataMax"]}
          axisLine={false}
          tick={false}
        />
        <Tooltip />
        <Radar
          name="Median"
          dataKey="median"
          stroke={colors.blue}
          fill={colors.blue}
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
          stroke={colors.teal}
          fill={colors.teal}
          fillOpacity={opacity}
        />
        <Radar
          name="Average"
          dataKey="average"
          stroke={colors.coral}
          fill={colors.coral}
          fillOpacity={opacity}
        />
        <Legend />
      </RadarChartBase>
    </ResponsiveContainer>
  );
};
