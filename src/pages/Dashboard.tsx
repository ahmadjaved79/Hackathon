import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatsView from "../components/StatsView";
import StudentsSummary from "../components/StudentsSummary";
import RoomsSummary from "../components/RoomsSummary";
import ProfileSettings from "../components/ProfileSettings";

const DashboardPage: React.FC = () => {
  const [active, setActive] = useState<"stats" | "students" | "rooms" | "generate" | "settings">("stats");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-6 px-4 md:px-6 py-6">
        <Sidebar active={active} onChange={setActive} />
        <main className="flex-1">
          {active === "stats" && <StatsView />}
          {active === "students" && <StudentsSummary />}
          {active === "rooms" && <RoomsSummary />}
          {active === "generate" && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-2">🧩 Generate Seating</h2>
              <p className="text-gray-600">Open the seat generation tool to allocate students.</p>
              <a href="/exam-seating" className="inline-block mt-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">
                Open Seat Generator
              </a>
            </div>
          )}
          {active === "settings" && <ProfileSettings />}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
