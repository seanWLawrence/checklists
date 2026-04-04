"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/button";
import { PieChart } from "./pie-chart";
import { AverageKey } from "./line-chart";
import { LineChartData } from "../../lib/get-line-chart-data.lib";
import { PieChartData } from "../../lib/get-pie-chart-data.lib";

type RatingKey = "energy" | "mood" | "productivity";

type RatingTab = {
  key: RatingKey;
  averageKey: AverageKey;
  name: string;
};

const RATING_TABS: RatingTab[] = [
  {
    key: "energy",
    averageKey: "energyAvg7",
    name: "Energy",
  },
  {
    key: "mood",
    averageKey: "moodAvg7",
    name: "Mood",
  },
  {
    key: "productivity",
    averageKey: "productivityAvg7",
    name: "Productivity",
  },
];

const LineChart = dynamic(
  () => import("./line-chart").then((mod) => mod.LineChart),
  { ssr: false, loading: () => <div className="min-h-[200px]" /> },
);

export const LevelChartsTabs: React.FC<{
  pie: PieChartData;
  line: LineChartData;
}> = ({ pie, line }) => {
  const [selectedKey, setSelectedKey] = useState<RatingKey>("energy");

  const selectedTab = useMemo(() => {
    return RATING_TABS.find((tab) => tab.key === selectedKey) ?? RATING_TABS[0];
  }, [selectedKey]);

  const pieData = useMemo(() => {
    return pie.find((set) => set[0]?.name === selectedTab.name);
  }, [pie, selectedTab.name]);

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-2 justify-center w-full min-w-[90vw]">
        {RATING_TABS.map((tab) => {
          const isActive = tab.key === selectedKey;
          return (
            <Button
              key={tab.key}
              type="button"
              variant={isActive ? "primary" : "outline"}
              onClick={() => setSelectedKey(tab.key)}
            >
              {tab.name}
            </Button>
          );
        })}
      </div>

      <div className="space-y-6">
        {pieData && <PieChart data={pieData} />}

        <LineChart
          data={line}
          dataKey={selectedTab.key}
          averageKey={selectedTab.averageKey}
          name={selectedTab.name}
        />
      </div>
    </div>
  );
};
