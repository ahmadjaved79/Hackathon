import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";

const ProfilePopover: React.FC = () => {
  const { profile } = useDashboard();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen((s) => !s)} className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="font-semibold text-sm text-gray-700">{profile.name.charAt(0).toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg z-30 p-3">
          <div className="text-sm font-medium text-gray-800">{profile.name}</div>
          <div className="text-xs text-gray-500 mb-3">{profile.email}</div>
          <div className="flex flex-col gap-2">
            <a href="/profile" className="text-sm text-blue-600 hover:underline">Edit Profile</a>
            <button onClick={() => (window.location.href = "/")} className="text-sm text-red-600 hover:underline text-left">
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePopover;
