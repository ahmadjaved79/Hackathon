import React from "react";
import { useDashboard } from "../context/DashboardContext";
import ProfilePopover from "./ProfilePopover";

const Navbar: React.FC = () => {
  const { profile } = useDashboard();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="https://res.cloudinary.com/dcmt06mac/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1765486367/logo_c1mgsg.jpg" alt="logo" className="h-10 w-10 rounded" />
          <div>
            <h1 className="text-lg font-bold text-gray-800">VigilSeat — Anti-Cheat Seating</h1>
            <p className="text-xs text-gray-500">Smart, fast & fair seat allocation</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right mr-3">
            <div className="text-sm font-medium text-gray-700">{profile.name}</div>
            <div className="text-xs text-gray-500">{profile.email}</div>
          </div>
          <ProfilePopover />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
