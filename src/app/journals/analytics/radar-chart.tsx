"use client";
import {
  Legend,
  RadarChart as RadarChartBase,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import { RadarChartData } from "../journal.model";
import { colors } from "@/lib/chart-colors";
import { useEffect, useState } from "react";

const opacity = 0.5;

export const RadarChart: React.FC<{
  data: RadarChartData;
}> = ({ data }) => {
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <RadarChartBase outerRadius={90} width={400} height={300} data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey="name" />
      <PolarRadiusAxis domain={[0, "dataMax"]} axisLine={false} tick={false} />
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
  );
};
