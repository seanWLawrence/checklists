"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as LineChartBase,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "@/lib/chart-colors";
import { useEffect, useState } from "react";
import { LineChartData } from "../../lib/get-line-chart-data.lib";

const LineChart: React.FC<{ data: LineChartData }> = ({ data }) => {
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  console.log({ data });

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
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          dataKey="date"
          name="Date"
          angle={-90}
          type="category"
          height={50}
          tick={{ fontSize: 12 }}
        />

        <YAxis
          width="auto"
          interval="preserveStartEnd"
          type="number"
          domain={[0, 5]}
          includeHidden
          scale="linear"
        />

        <Tooltip />

        <Legend />

        <Line
          dataKey="creativityLevel"
          stroke={colors.blue}
          name="Creativity"
        />

        <Line dataKey="moodLevel" stroke={colors.fuschia} name="Mood" />

        <Line dataKey="energyLevel" stroke={colors.fuschia} name="Energy" />

        <Line dataKey="healthLevel" stroke={colors.coral} name="Health" />

        <Line
          type="monotone"
          dataKey="relationshipsLevel"
          stroke={colors.purple}
          name="Relationships"
        />
      </LineChartBase>
    </div>
  );
};

export default LineChart;
