import React from "react";
import { useDashboard } from "../context/DashboardContext";

const RoomsSummary: React.FC = () => {
  const { rooms } = useDashboard();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Rooms overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rooms.map((r) => (
          <div key={r.id} className="p-4 rounded-lg border flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">{r.roomNo}</div>
              <div className="text-lg font-semibold text-gray-800">Capacity: {r.capacity}</div>
              <div className="text-xs text-gray-400">Last used: {r.lastUsed}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Utilization</div>
              <div className="text-xl font-bold text-blue-600"> {Math.round(Math.random() * 70 + 20)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsSummary;
