import React from "react";

type Props = {
  active: string;
  onChange: (key: "stats" | "students" | "rooms" | "generate" | "settings") => void;
};

const Sidebar: React.FC<Props> = ({ active, onChange }) => {
  const items = [
    { key: "stats", label: "Stats", icon: "📊" },
    { key: "students", label: "Students", icon: "👥" },
    { key: "rooms", label: "Rooms", icon: "🏫" },
    { key: "generate", label: "Generate Seating", icon: "🎲" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ] as const;

  return (
    <aside className="w-64 bg-white rounded-xl p-4 shadow-sm border">
      <nav className="flex flex-col gap-2">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`w-full text-left px-3 py-3 rounded-md flex items-center gap-3 transition ${
              active === it.key ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-lg">{it.icon}</span>
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
