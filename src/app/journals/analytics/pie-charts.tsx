"use client";
import { Pie, PieChart as PieChartBase, Sector } from "recharts";
import { PieChartData } from "../journal.model";
import { colors } from "@/lib/chart-colors";
import { useEffect, useState } from "react";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

const ActiveShape: React.FC<PieSectorDataItem> = ({
  cx,
  cy,
  midAngle,
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
    !midAngle ||
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

  const RADIAN = Math.PI / 180;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

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
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >
        Level {payload.level}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`${value} entries (${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const PieChart: React.FC<{ data: PieChartData[0] }> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <PieChartBase width={600} height={300}>
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
    <div className="flex space-x-2 flex-wrap space-y-2">
      {data.map((d) => {
        return <PieChart key={d[0].name} data={d} />;
      })}
    </div>
  );
};

export default PieCharts;
