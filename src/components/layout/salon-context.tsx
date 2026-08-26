"use client";

import { createContext, useContext } from "react";

export type ActiveSalon = {
  id: string;
  name: string;
  slug: string;
  status: string;
  aiActive: boolean;
  timezone: string;
};

const SalonContext = createContext<ActiveSalon | null>(null);

export function SalonProvider({
  salon,
  children,
}: {
  salon: ActiveSalon;
  children: React.ReactNode;
}) {
  return <SalonContext.Provider value={salon}>{children}</SalonContext.Provider>;
}

export function useActiveSalon(): ActiveSalon {
  const ctx = useContext(SalonContext);
  if (!ctx) throw new Error("useActiveSalon must be used within SalonProvider");
  return ctx;
}
