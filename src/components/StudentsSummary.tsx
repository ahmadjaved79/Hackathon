import React from "react";
import { useDashboard } from "../context/DashboardContext";

const StudentsSummary: React.FC = () => {
  const { branchCounts } = useDashboard();
  const rows = Object.entries(branchCounts);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Students — counts by branch</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map(([branch, count]) => (
          <div key={branch} className="p-4 rounded-lg border bg-gray-50">
            <div className="text-sm text-gray-500">{branch}</div>
            <div className="text-2xl font-bold text-gray-800">{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentsSummary;
