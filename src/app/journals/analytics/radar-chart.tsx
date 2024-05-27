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
import { JournalLevelsRadarChartData } from "../journal.model";

const radarToColor: Record<string, string> = {
  average: "#4062BB", // blue
  median: "#E07BE0", // fuscshia
  eightiethPercentile: "#59C3C3", // teal
  twentiethPercentile: "#F45B69", // coral
};

const opacity = 0.5;

export const RadarChart: React.FC<{
  data: JournalLevelsRadarChartData;
}> = ({ data }) => {
  return (
    <ResponsiveContainer width={'100%'} height={450}>
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
          stroke={radarToColor.median}
          fill={radarToColor.median}
          fillOpacity={opacity}
        />
        <Radar
          name="80th percentile"
          dataKey="eightiethPercentile"
          stroke={radarToColor.eightiethPercentile}
          fill={radarToColor.eightiethPercentile}
          fillOpacity={opacity}
        />
        <Radar
          name="20th percentile"
          dataKey="twentiethPercentile"
          stroke={radarToColor.twentiethPercentile}
          fill={radarToColor.twentiethPercentile}
          fillOpacity={opacity}
        />
        <Radar
          name="Average"
          dataKey="average"
          stroke={radarToColor.average}
          fill={radarToColor.average}
          fillOpacity={opacity}
        />
        <Legend />
      </RadarChartBase>
    </ResponsiveContainer>
  );
};
