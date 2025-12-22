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
import { useEffect, useState } from "react";
import { LineChartData } from "../../lib/get-line-chart-data.lib";
import { colors } from "@/lib/chart-colors";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "short",
});

const LineChart: React.FC<{
  data: LineChartData;
  dataKey: string;
  name: string;
  color: string;
}> = ({ data, dataKey, name, color }) => {
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
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis
          dataKey="dateMilli"
          name="Date"
          angle={-90}
          type="number"
          height={50}
          tick={{ fontSize: 12 }}
          domain={["dataMin", "dataMax"]}
          scale="time"
          tickFormatter={(dateMilli) => {
            return dateFormatter.format(new Date(dateMilli));
          }}
        />

        <YAxis
          width="auto"
          interval="preserveStartEnd"
          type="number"
          domain={[0, 5]}
          includeHidden
          scale="linear"
        />

        <Tooltip
          labelFormatter={(dateMilli) => dateFormatter.format(dateMilli)}
        />

        <Legend />

        <Line dataKey={dataKey} stroke={color} name={name} />
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
        name="Energy"
        color={colors.blue}
      />
      <LineChart
        data={data}
        dataKey="moodLevel"
        name="Mood"
        color={colors.fuschia}
      />
      <LineChart
        data={data}
        dataKey="healthLevel"
        name="Health"
        color={colors.teal}
      />
      <LineChart
        data={data}
        dataKey="creativityLevel"
        name="Creativity"
        color={colors.coral}
      />
      <LineChart
        data={data}
        dataKey="relationshipsLevel"
        name="Relationships"
        color={colors.purple}
      />
    </div>
  );
};

export default LineCharts;
