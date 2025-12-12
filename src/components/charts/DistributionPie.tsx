import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#2563EB", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

type Props = { data: Record<string, number> };

const DistributionPie: React.FC<Props> = ({ data }) => {
  const arr = Object.entries(data).map(([name, value]) => ({ name, value }));
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={arr} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {arr.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistributionPie;
