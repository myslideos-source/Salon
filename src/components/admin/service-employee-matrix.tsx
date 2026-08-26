"use client";

import { useState, useTransition } from "react";
import { setEmployeeServiceAction } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

export function ServiceEmployeeMatrix({
  salonId,
  services,
  employees,
  links,
}: {
  salonId: string;
  services: { id: string; name: string }[];
  employees: { id: string; first_name: string; last_name: string }[];
  links: { employee_id: string; service_id: string }[];
}) {
  const [state, setState] = useState(
    new Set(links.map((l) => `${l.employee_id}:${l.service_id}`))
  );
  const [, startTransition] = useTransition();

  function toggle(employeeId: string, serviceId: string) {
    const key = `${employeeId}:${serviceId}`;
    const next = new Set(state);
    const enabled = !next.has(key);
    if (enabled) next.add(key);
    else next.delete(key);
    setState(next);
    startTransition(() => setEmployeeServiceAction(salonId, employeeId, serviceId, enabled));
  }

  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-ink-faint pb-2 pr-4">Leistung</th>
            {employees.map((e) => (
              <th key={e.id} className="text-xs font-medium text-ink-faint pb-2 px-2 text-center">
                {e.first_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <td className="py-2 pr-4 text-ink">{s.name}</td>
              {employees.map((e) => {
                const active = state.has(`${e.id}:${s.id}`);
                return (
                  <td key={e.id} className="py-2 px-2 text-center">
                    <button
                      onClick={() => toggle(e.id, s.id)}
                      className={cn(
                        "h-5 w-5 rounded-md border transition-colors",
                        active ? "border-bronze bg-bronze" : "border-border-strong bg-white"
                      )}
                      aria-label={`${e.first_name} – ${s.name}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-faint">
        Kein Häkchen bei einer Leistung = alle aktiven Mitarbeiter dürfen sie anbieten.
      </p>
    </div>
  );
}
