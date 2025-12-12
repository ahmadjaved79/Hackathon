import React from "react";
import { useDashboard } from "../context/DashboardContext";
import { StatCards } from "./StatCards";
import PerformanceBar from "./charts/PerformanceBar";
import DistributionPie from "./charts/DistributionPie";

const StatsView: React.FC = () => {
  const { accuracyHistory, allocationTimes, cheatReduction, totalAllocations, branchCounts } = useDashboard();

  const cards = [
    { label: "Algorithm Accuracy", value: `${accuracyHistory[accuracyHistory.length - 1]?.accuracy ?? 0}%`, sub: "Latest run" },
    { label: "Avg Allocation Time", value: `${allocationTimes}s`, sub: "Seconds per run" },
    { label: "Cheating Reduction", value: `${cheatReduction}%`, sub: "Estimated reduction" },
    { label: "Total Allocations", value: totalAllocations, sub: "Runs performed" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">System Performance</h2>
      <StatCards stats={cards} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="mb-2 font-semibold">Accuracy over time</h3>
          <PerformanceBar data={accuracyHistory} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h3 className="mb-2 font-semibold">Branch distribution</h3>
          <DistributionPie data={branchCounts} />
        </div>
      </div>
    </div>
  );
};

export default StatsView;
