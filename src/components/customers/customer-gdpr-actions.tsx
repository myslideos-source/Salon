"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportCustomerDataAction, deleteCustomerDataAction } from "@/lib/actions/customers";

// DSGVO Art. 15/17/20: ein vollständiger Export als herunterladbare JSON-
// Datei und eine (unwiderrufliche) Löschung/Anonymisierung, siehe
// 0026_gdpr.sql. Beide laufen über has_permission('manage_customers').
export function CustomerGdprActions({
  salonId,
  customerId,
  redirectPath,
}: {
  salonId: string;
  customerId: string;
  redirectPath: string;
}) {
  const router = useRouter();
  const [exportPending, startExport] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function exportData() {
    setError(null);
    startExport(async () => {
      const result = await exportCustomerDataAction(salonId, customerId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kunde-${customerId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function deleteData() {
    if (!confirm("Kundendaten wirklich löschen? Name, Telefonnummer und E-Mail werden unwiderruflich anonymisiert. Termine und Anrufe bleiben als Historie erhalten.")) return;
    setError(null);
    startDelete(async () => {
      const result = await deleteCustomerDataAction(salonId, customerId, redirectPath);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(redirectPath);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportData} disabled={exportPending}>
        <Download className="h-3.5 w-3.5" /> {exportPending ? "Wird exportiert…" : "Daten exportieren"}
      </Button>
      <Button variant="ghost" size="sm" onClick={deleteData} disabled={deletePending} className="text-danger hover:bg-danger-soft">
        <Trash2 className="h-3.5 w-3.5" /> {deletePending ? "Wird gelöscht…" : "Kunde löschen (DSGVO)"}
      </Button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </div>
  );
}
