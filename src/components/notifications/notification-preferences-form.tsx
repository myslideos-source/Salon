"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { setNotificationPreferenceAction } from "@/lib/actions/notifications";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_AVAILABLE,
  NOTIFICATION_CHANNEL_LABEL,
  NOTIFICATION_CHANNEL_UNAVAILABLE_REASON,
  NOTIFICATION_EVENT_LABEL,
  NOTIFICATION_EVENT_TYPES,
  type NotificationChannel,
  type NotificationEventType,
} from "@/lib/notifications/types";

type PrefKey = `${NotificationEventType}:${NotificationChannel}`;

export function NotificationPreferencesForm({
  salonId,
  redirectPath,
  preferences,
}: {
  salonId: string;
  redirectPath: string;
  preferences: { event_type: string; channel: string; enabled: boolean }[];
}) {
  const initial = new Map<PrefKey, boolean>();
  for (const p of preferences) initial.set(`${p.event_type as NotificationEventType}:${p.channel as NotificationChannel}`, p.enabled);

  const [state, setState] = useState(initial);
  const [, startTransition] = useTransition();

  function isEnabled(eventType: NotificationEventType, channel: NotificationChannel): boolean {
    const key: PrefKey = `${eventType}:${channel}`;
    // Ohne gespeicherte Präferenz ist ein technisch verfügbarer Kanal
    // standardmäßig aktiv (Opt-out), ein nicht eingerichteter Kanal
    // standardmäßig inaktiv.
    return state.has(key) ? state.get(key)! : NOTIFICATION_CHANNEL_AVAILABLE[channel];
  }

  function toggle(eventType: NotificationEventType, channel: NotificationChannel) {
    if (!NOTIFICATION_CHANNEL_AVAILABLE[channel]) return;
    const next = !isEnabled(eventType, channel);
    const key: PrefKey = `${eventType}:${channel}`;
    setState((prev) => new Map(prev).set(key, next));
    startTransition(async () => {
      try {
        await setNotificationPreferenceAction(salonId, eventType, channel, next, redirectPath);
      } catch {
        setState((prev) => new Map(prev).set(key, !next));
      }
    });
  }

  return (
    <Card>
      <CardHeader
        title="Benachrichtigungskanäle"
        subtitle="Für welche Ereignisse möchtest du auf welchem Kanal benachrichtigt werden?"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-soft">
              <th className="px-5 py-2 font-medium">Ereignis</th>
              {NOTIFICATION_CHANNELS.map((channel) => (
                <th key={channel} className="px-3 py-2 text-center font-medium">
                  {NOTIFICATION_CHANNEL_LABEL[channel]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {NOTIFICATION_EVENT_TYPES.map((eventType) => (
              <tr key={eventType}>
                <td className="px-5 py-3 text-ink">{NOTIFICATION_EVENT_LABEL[eventType]}</td>
                {NOTIFICATION_CHANNELS.map((channel) => {
                  const available = NOTIFICATION_CHANNEL_AVAILABLE[channel];
                  const enabled = isEnabled(eventType, channel);
                  return (
                    <td key={channel} className="px-3 py-3 text-center">
                      <button
                        type="button"
                        disabled={!available}
                        onClick={() => toggle(eventType, channel)}
                        title={available ? undefined : NOTIFICATION_CHANNEL_UNAVAILABLE_REASON[channel]}
                        aria-label={`${NOTIFICATION_CHANNEL_LABEL[channel]} für ${NOTIFICATION_EVENT_LABEL[eventType]}`}
                        className={cn(
                          "inline-flex h-5 w-9 items-center rounded-full transition-colors",
                          !available ? "cursor-not-allowed bg-sand" : enabled ? "bg-bronze" : "bg-border-strong"
                        )}
                      >
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full bg-white shadow transition-transform",
                            !available ? "translate-x-0.5 opacity-60" : enabled ? "translate-x-[18px]" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
        <Badge tone="neutral">SMS: nicht eingerichtete Integration</Badge>
        <Badge tone="neutral">Push: nicht eingerichtete Integration</Badge>
      </div>
    </Card>
  );
}
