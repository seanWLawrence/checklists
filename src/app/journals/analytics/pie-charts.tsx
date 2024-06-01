"use client";
import {
  Pie,
  PieChart as PieChartBase,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { PieChartData } from "../journal.model";
import { colors } from "@/lib/chart-colors";
import { useEffect, useState } from "react";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

const ActiveShape: React.FC<PieSectorDataItem> = ({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  payload,
  percent,
  value,
}) => {
  if (
    !outerRadius ||
    !cx ||
    !cy ||
    !percent ||
    !payload ||
    !innerRadius ||
    !("name" in payload) ||
    typeof payload.name !== "string" ||
    !("level" in payload) ||
    typeof payload.level !== "string"
  ) {
    return null;
  }

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />

      <text x={cx} y={cy - 120} textAnchor="middle" fill="#333">
        Level {payload.level}
      </text>

      <text x={cx} y={cy - 100} textAnchor="middle" fill="#999">
        {`${value} entries (${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const PieChart: React.FC<{ data: PieChartData[0] }> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <ResponsiveContainer width="100%" height={280} minWidth={300}>
      <PieChartBase>
        <Pie
          data={data}
          dataKey="count"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          nameKey="name"
          activeShape={(props: PieSectorDataItem) => <ActiveShape {...props} />}
          activeIndex={activeIndex}
          onMouseEnter={(_, index) => setActiveIndex(index)}
          fill={colors.blue}
        ></Pie>
      </PieChartBase>
    </ResponsiveContainer>
  );
};

const PieCharts: React.FC<{ data: PieChartData }> = ({ data }) => {
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex space-x-1 flex-wrap space-y-1">
      {data.map((d) => {
        return <PieChart key={d[0].name} data={d} />;
      })}
    </div>
  );
};

export default PieCharts;
