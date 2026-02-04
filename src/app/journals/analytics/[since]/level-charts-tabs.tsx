"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/button";
import { PieChart } from "./pie-chart";
import { AverageKey } from "./line-chart";
import { LineChartData } from "../../lib/get-line-chart-data.lib";
import { PieChartData } from "../../lib/get-pie-chart-data.lib";
import { stubLineChartData } from "../../lib/line-chart-data.stub";
import { isProduction } from "@/lib/environment";

const USE_STUB_LINE_CHART_DATA = !isProduction();

type LevelKey =
  | "energyLevel"
  | "moodLevel"
  | "healthLevel"
  | "creativityLevel"
  | "relationshipsLevel";

type LevelTab = {
  key: LevelKey;
  averageKey: AverageKey;
  name: string;
};

const LEVEL_TABS: LevelTab[] = [
  {
    key: "energyLevel",
    averageKey: "energyLevelAvg7",
    name: "Energy",
  },
  {
    key: "moodLevel",
    averageKey: "moodLevelAvg7",
    name: "Mood",
  },
  {
    key: "healthLevel",
    averageKey: "healthLevelAvg7",
    name: "Health",
  },
  {
    key: "creativityLevel",
    averageKey: "creativityLevelAvg7",
    name: "Creativity",
  },
  {
    key: "relationshipsLevel",
    averageKey: "relationshipsLevelAvg7",
    name: "Relationships",
  },
];

const LineChart = dynamic(
  () => import("./line-chart").then((mod) => mod.LineChart),
  { ssr: false, loading: () => <div className="min-h-[200px]" /> },
);

// TODO cleanup

export const LevelChartsTabs: React.FC<{
  pie: PieChartData;
  line: LineChartData;
}> = ({ pie, line }) => {
  const [selectedKey, setSelectedKey] = useState<LevelKey>("energyLevel");

  const selectedTab = useMemo(() => {
    return LEVEL_TABS.find((tab) => tab.key === selectedKey) ?? LEVEL_TABS[0];
  }, [selectedKey]);

  const pieData = useMemo(() => {
    return pie.find((set) => set[0]?.name === selectedTab.name);
  }, [pie, selectedTab.name]);

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-2 justify-center w-full min-w-[90vw]">
        {LEVEL_TABS.map((tab) => {
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
          data={USE_STUB_LINE_CHART_DATA ? stubLineChartData : line}
          dataKey={selectedTab.key}
          averageKey={selectedTab.averageKey}
          name={selectedTab.name}
        />
      </div>
    </div>
  );
};
