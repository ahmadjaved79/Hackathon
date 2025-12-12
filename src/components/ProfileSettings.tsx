import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext";

const ProfileSettings: React.FC = () => {
  const { profile, saveProfile } = useDashboard();
  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);

  const onSave = () => {
    saveProfile({ name, email });
    alert("Profile saved!");
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Profile settings</h2>
      <div className="grid grid-cols-1 gap-4">
        <input value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2 border rounded" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="px-4 py-2 border rounded" />
        <div className="flex gap-3">
          <button onClick={onSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
          <button onClick={() => { setName(profile.name); setEmail(profile.email); }} className="px-4 py-2 rounded border">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
