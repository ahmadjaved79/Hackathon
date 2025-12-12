import React from "react";

type Card = { label: string; value: string | number; sub?: string };

export const StatCards: React.FC<{ stats: Card[] }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="text-xs text-gray-500">{s.label}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-800">{s.value}</div>
          {s.sub && <div className="text-xs text-gray-400 mt-1">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
};
