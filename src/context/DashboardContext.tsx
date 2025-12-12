import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Room = {
  id: string;
  roomNo: string;
  rows: number;
  cols: number;
  capacity: number;
  lastUsed: string;
};

type DashboardContextValue = {
  accuracyHistory: { date: string; accuracy: number }[];
  allocationTimes: number;
  cheatReduction: number;
  totalAllocations: number;
  branchCounts: Record<string, number>;
  rooms: Room[];
  profile: { name: string; email: string };
  saveProfile: (p: { name: string; email: string }) => void;

  // optional setters for future use
  setAccuracyHistory?: React.Dispatch<React.SetStateAction<{ date: string; accuracy: number }[]>>;
  setAllocationTimes?: React.Dispatch<React.SetStateAction<number>>;
  setCheatReduction?: React.Dispatch<React.SetStateAction<number>>;
  setTotalAllocations?: React.Dispatch<React.SetStateAction<number>>;
  setBranchCounts?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setRooms?: React.Dispatch<React.SetStateAction<Room[]>>;
};

const defaultValue: DashboardContextValue = {
  accuracyHistory: [],
  allocationTimes: 0,
  cheatReduction: 0,
  totalAllocations: 0,
  branchCounts: {},
  rooms: [],
  profile: { name: "Admin User", email: "admin@college.edu" },
  saveProfile: () => {},
};

const DashboardContext = createContext<DashboardContextValue>(defaultValue);

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accuracyHistory, setAccuracyHistory] = useState<{ date: string; accuracy: number }[]>(
    () => [
      { date: "2025-11-01", accuracy: 88 },
      { date: "2025-11-05", accuracy: 90 },
      { date: "2025-11-10", accuracy: 92 },
      { date: "2025-11-15", accuracy: 93 },
      { date: "2025-11-20", accuracy: 95 },
    ]
  );

  const [allocationTimes, setAllocationTimes] = useState<number>(1.8);
  const [cheatReduction, setCheatReduction] = useState<number>(72);
  const [totalAllocations, setTotalAllocations] = useState<number>(124);
  const [branchCounts, setBranchCounts] = useState<Record<string, number>>({
    CSE: 320,
    ECE: 240,
    MECH: 180,
    EEE: 120,
    CIVIL: 90,
    IT: 75,
  });

  const [rooms, setRooms] = useState<Room[]>([
    { id: "R101", roomNo: "A101", rows: 10, cols: 8, capacity: 80, lastUsed: "2025-11-20" },
    { id: "R102", roomNo: "B205", rows: 12, cols: 10, capacity: 120, lastUsed: "2025-11-18" },
    { id: "R201", roomNo: "C303", rows: 8, cols: 6, capacity: 48, lastUsed: "2025-11-19" },
  ]);

  const [profile, setProfile] = useState<{ name: string; email: string }>(() => {
    const saved = localStorage.getItem("vs_profile");
    return saved ? JSON.parse(saved) : { name: "Admin User", email: "admin@college.edu" };
  });

  const saveProfile = (payload: { name: string; email: string }) => {
    setProfile(payload);
  };

  useEffect(() => {
    localStorage.setItem("vs_profile", JSON.stringify(profile));
  }, [profile]);

  const value: DashboardContextValue = {
    accuracyHistory,
    allocationTimes,
    cheatReduction,
    totalAllocations,
    branchCounts,
    rooms,
    profile,
    saveProfile,
    setAccuracyHistory,
    setAllocationTimes,
    setCheatReduction,
    setTotalAllocations,
    setBranchCounts,
    setRooms,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
