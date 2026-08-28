"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, BellRing, Bell, BellOff, Search, X } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { DayView } from "./day-view";
import { WeekGrid } from "./week-grid";
import { MonthGrid } from "./month-grid";
import { MobileAgenda } from "./mobile-agenda";
import { MobileDateStrip } from "./mobile-date-strip";
import { CalendarListView } from "./calendar-list-view";
import { MiniMonthCalendar } from "./mini-month-calendar";
import { TodayAppointmentsCard } from "./today-appointments-card";
import { WeekStatsCard } from "./week-stats-card";
import { MultiSelectFilter } from "./multi-select-filter";
import { NewAppointmentModal } from "./new-appointment-modal";
import { CalendarFeedCard } from "@/components/portal/calendar-feed-card";
import {
  getDayCalendarDataAction,
  getSalonEmployeesAction,
  getSalonLocationsAction,
  type CalendarAppointment,
  type CalendarEmployee,
  type CalendarLocation,
} from "@/lib/actions/calendar-data";
import { addDaysStr, formatDayLabel, formatMonthLabel, formatWeekRange, startOfWeekStr, todayStr, weekDatesFrom } from "@/lib/date";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { APPOINTMENT_STATUSES } from "@/lib/scheduling/status";
import { matchesCalendarFilters, type CalendarFilters } from "@/lib/scheduling/calendar-filters";

type Service = { id: string; name: string; duration_minutes: number; price_cents: number; color: string };
type View = "day" | "week" | "month" | "list";

export function CalendarShell({
  salonId,
  basePath,
  appointmentsHref,
  services,
  slotGranularity,
  canEdit,
  avatarLabel,
  avatarImageUrl,
  initialDate,
  showCalendarFeed,
}: {
  salonId: string;
  basePath: string;
  appointmentsHref: string;
  services: Service[];
  slotGranularity: number;
  canEdit: boolean;
  avatarLabel: string;
  avatarImageUrl?: string;
  initialDate?: string;
  /** Salon-portal self-service ICS calendar-subscription card - not shown
   * in the admin calendar, which manages many salons at once. */
  showCalendarFeed?: boolean;
}) {
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(initialDate ?? todayStr());
  const [mobileDate, setMobileDate] = useState(initialDate ?? todayStr());
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState<{
    timezone: string;
    employees: CalendarEmployee[];
    appointments: CalendarAppointment[];
    businessHours: { isClosed: boolean; startTime: string | null; endTime: string | null } | null;
  } | null>(null);
  const [mobileDayData, setMobileDayData] = useState<typeof dayData>(null);
  const [employees, setEmployees] = useState<CalendarEmployee[]>([]);
  const [locations, setLocations] = useState<CalendarLocation[]>([]);
  const [employeeIds, setEmployeeIds] = useState<Set<string>>(new Set());
  const [locationIds, setLocationIds] = useState<Set<string>>(new Set());
  const [serviceIds, setServiceIds] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const filters: CalendarFilters = { employeeIds, locationIds, serviceIds, statuses, search: search.trim().toLowerCase() };
  // Kept for the mobile FAB/employee-count checks that predate the generic filter set.
  const employeeFilter = employeeIds;
  const [showNew, setShowNew] = useState(false);
  const [weekRefreshKey, setWeekRefreshKey] = useState(0);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const notifyEnabledRef = useRef(notifyEnabled);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a per-browser preference, not app state
    setNotifyEnabled(localStorage.getItem("hallomia_calendar_notify") === "1");
  }, []);

  useEffect(() => {
    notifyEnabledRef.current = notifyEnabled;
  }, [notifyEnabled]);

  function playChime() {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = (audioCtxRef.current ??= new AudioCtx());
    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.32);
    });
  }

  // Toggling is the user gesture that unlocks audio playback for the rest
  // of the page's lifetime (browsers block AudioContext without one) and,
  // on first enable, asks for OS-notification permission so a new booking
  // still alerts the salon even while this tab is in the background - the
  // "wie man's vom Handy kennt" behavior.
  function toggleNotify() {
    const next = !notifyEnabled;
    setNotifyEnabled(next);
    localStorage.setItem("hallomia_calendar_notify", next ? "1" : "0");
    if (!next) return;
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) audioCtxRef.current ??= new AudioCtx();
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }

  const load = useCallback(() => {
    setLoading(true);
    getDayCalendarDataAction(salonId, date).then((res) => {
      setDayData(res);
      setLoading(false);
    });
  }, [salonId, date]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on view/date change
    if (view === "day") load();
  }, [view, load]);

  useEffect(() => {
    getSalonEmployeesAction(salonId).then(setEmployees);
    getSalonLocationsAction(salonId).then(setLocations);
  }, [salonId]);

  // On mobile, "Woche" renders as an agenda for one selected day within the
  // week, fetched the same way as the day view.
  useEffect(() => {
    if (view !== "week") return;
    getDayCalendarDataAction(salonId, mobileDate).then(setMobileDayData);
  }, [salonId, mobileDate, view, weekRefreshKey]);

  const viewRef = useRef(view);
  const loadRef = useRef(load);
  useEffect(() => {
    viewRef.current = view;
    loadRef.current = load;
  }, [view, load]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`appointments-${salonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `salon_id=eq.${salonId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLiveNotice("Neuer Termin eingegangen");
            setTimeout(() => setLiveNotice(null), 5000);
            if (notifyEnabledRef.current) {
              playChime();
              if (document.hidden && "Notification" in window && Notification.permission === "granted") {
                new Notification("HalloMia", { body: "Neuer Termin eingegangen", tag: "hallomia-new-appointment" });
              }
            }
          }
          if (viewRef.current === "day") loadRef.current();
          setWeekRefreshKey((k) => k + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId]);

  const weekStart = startOfWeekStr(date);
  const weekDates = weekDatesFrom(weekStart);

  function step(dir: 1 | -1) {
    if (view === "day") setDate((d) => addDaysStr(d, dir));
    else if (view === "week") setDate((d) => addDaysStr(d, dir * 7));
    else setDate((d) => addDaysStr(d, dir * 30));
  }

  const dateLabel =
    view === "day"
      ? formatDayLabel(date)
      : view === "week"
        ? formatWeekRange(weekStart)
        : view === "month"
          ? formatMonthLabel(date)
          : `Termine ab ${formatDayLabel(date)}`;

  const serviceOptions = services.map((s) => ({ id: s.id, label: s.name, color: s.color }));
  const locationOptions = locations.map((l) => ({ id: l.id, label: l.name }));
  const statusOptions = APPOINTMENT_STATUSES.map((s) => ({ id: s.value, label: s.label }));

  return (
    <div className="max-w-full overflow-x-hidden">
      <Topbar
        title="Kalender"
        subtitle="Behalte alle Termine im Blick."
        avatarLabel={avatarLabel}
        avatarImageUrl={avatarImageUrl}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={toggleNotify}
              aria-label={notifyEnabled ? "Live-Benachrichtigung mit Ton ausschalten" : "Live-Benachrichtigung mit Ton einschalten"}
              title={notifyEnabled ? "Live-Benachrichtigung mit Ton ist an" : "Live-Benachrichtigung mit Ton einschalten"}
              className={cn(
                "rounded-xl p-2 transition-colors",
                notifyEnabled ? "bg-bronze-soft text-bronze-dark" : "text-ink-soft hover:bg-sand"
              )}
            >
              {notifyEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
            {canEdit && (
              <button
                onClick={() => setShowNew(true)}
                aria-label="Neuer Termin"
                className="brand-gradient-bg flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(169,112,255,0.25)] transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Neuer Termin</span>
              </button>
            )}
          </div>
        }
      />

      {showCalendarFeed && <CalendarFeedCard />}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => step(-1)} aria-label="Vorheriger Zeitraum" className="rounded-lg p-1.5 text-ink-soft hover:bg-sand">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => step(1)} aria-label="Nächster Zeitraum" className="rounded-lg p-1.5 text-ink-soft hover:bg-sand">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="font-display text-base capitalize text-ink sm:text-lg">{dateLabel}</span>
          {date !== todayStr() && (
            <button
              onClick={() => {
                setDate(todayStr());
                setMobileDate(todayStr());
              }}
              className="rounded-lg border border-border-strong px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-sand"
            >
              Heute
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border-strong p-0.5">
            {(["day", "week", "month", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  view === v
                    ? "brand-gradient-bg text-white shadow-[0_0_10px_rgba(169,112,255,0.35)]"
                    : "text-ink-soft hover:bg-sand"
                )}
              >
                {v === "day" ? "Tag" : v === "week" ? "Woche" : v === "month" ? "Monat" : "Liste"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
        {searchOpen ? (
          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-border-strong bg-cream-soft px-3 py-1.5 sm:flex-none sm:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kunde, Telefon, Leistung, Notiz…"
              aria-label="Termine durchsuchen"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
            <button
              onClick={() => {
                setSearch("");
                setSearchOpen(false);
              }}
              aria-label="Suche schließen"
              className="shrink-0 text-ink-faint hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border-strong px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-sand"
          >
            <Search className="h-3.5 w-3.5" /> Suche
          </button>
        )}
        <MultiSelectFilter
          label="Mitarbeiter"
          allLabel="Alle Mitarbeiter"
          options={employees.map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}`.trim(), color: e.color }))}
          selected={employeeIds}
          onChange={setEmployeeIds}
        />
        <MultiSelectFilter label="Standorte" allLabel="Alle Standorte" options={locationOptions} selected={locationIds} onChange={setLocationIds} />
        <MultiSelectFilter label="Terminarten" allLabel="Alle Terminarten" options={serviceOptions} selected={serviceIds} onChange={setServiceIds} />
        <MultiSelectFilter label="Status" allLabel="Alle Status" options={statusOptions} selected={statuses} onChange={setStatuses} />
      </div>

      {view === "week" && (
        <div className="border-b border-border py-3 lg:hidden">
          <MobileDateStrip dates={weekDates} selectedDate={mobileDate} onSelect={setMobileDate} />
        </div>
      )}

      {liveNotice && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-bronze/30 bg-bronze-soft px-3 py-2 text-sm text-bronze-dark sm:mx-6 lg:mx-8">
          <BellRing className="h-4 w-4 shrink-0" />
          {liveNotice}
        </div>
      )}

      <div className="lg:flex lg:items-start">
        <div className="min-w-0 flex-1">
          {view === "day" &&
            (loading || !dayData ? (
              <div className="p-10 text-center text-sm text-ink-faint">Kalender wird geladen…</div>
            ) : (
              <DayView
                salonId={salonId}
                date={date}
                timezone={dayData.timezone}
                employees={employeeFilter.size > 0 ? dayData.employees.filter((e) => employeeFilter.has(e.id)) : dayData.employees}
                services={services}
                appointments={dayData.appointments.filter((a) =>
                  matchesCalendarFilters(a, dayData.employees.find((e) => e.id === a.employeeId)?.locationId, filters)
                )}
                businessHours={dayData.businessHours}
                slotGranularity={slotGranularity}
                canEdit={canEdit}
                revalidatePath={basePath}
                onChanged={load}
              />
            ))}

          {view === "week" && (
            <>
              <div className="hidden lg:block">
                <WeekGrid
                  salonId={salonId}
                  dates={weekDates}
                  timezone={dayData?.timezone ?? "Europe/Berlin"}
                  services={services}
                  slotGranularity={slotGranularity}
                  canEdit={canEdit}
                  revalidatePath={basePath}
                  filters={filters}
                  refreshKey={weekRefreshKey}
                  onSelectDay={(d) => {
                    setDate(d);
                    setView("day");
                  }}
                />
              </div>
              <div className="lg:hidden">
                {!mobileDayData ? (
                  <div className="p-10 text-center text-sm text-ink-faint">Kalender wird geladen…</div>
                ) : (
                  <MobileAgenda
                    salonId={salonId}
                    date={mobileDate}
                    timezone={mobileDayData.timezone}
                    employees={employeeFilter.size > 0 ? mobileDayData.employees.filter((e) => employeeFilter.has(e.id)) : mobileDayData.employees}
                    appointments={mobileDayData.appointments.filter((a) =>
                      matchesCalendarFilters(a, mobileDayData.employees.find((e) => e.id === a.employeeId)?.locationId, filters)
                    )}
                    canEdit={canEdit}
                    revalidatePath={basePath}
                    onChanged={() => getDayCalendarDataAction(salonId, mobileDate).then(setMobileDayData)}
                  />
                )}
                <div className="px-4 pb-24 sm:px-6">
                  <WeekStatsCard salonId={salonId} dates={weekDates} refreshKey={weekRefreshKey} />
                </div>
              </div>
            </>
          )}

          {view === "month" && (
            <MonthGrid
              salonId={salonId}
              monthDate={date}
              refreshKey={weekRefreshKey}
              filters={filters}
              onSelectDay={(d) => {
                setDate(d);
                setMobileDate(d);
                setView("day");
              }}
            />
          )}

          {view === "list" && (
            <CalendarListView
              salonId={salonId}
              fromDate={date}
              toDate={addDaysStr(date, 30)}
              filters={filters}
              canEdit={canEdit}
              revalidatePath={basePath}
              refreshKey={weekRefreshKey}
              onChanged={() => setWeekRefreshKey((k) => k + 1)}
            />
          )}
        </div>

        <aside className="hidden w-72 shrink-0 space-y-4 border-l border-border p-4 lg:block">
          <MiniMonthCalendar
            salonId={salonId}
            selectedDate={date}
            onSelectDate={(d) => {
              setDate(d);
              setMobileDate(d);
            }}
          />
          <TodayAppointmentsCard
            salonId={salonId}
            timezone={dayData?.timezone ?? "Europe/Berlin"}
            refreshKey={weekRefreshKey}
            appointmentsHref={appointmentsHref}
          />
          <WeekStatsCard salonId={salonId} dates={weekDates} refreshKey={weekRefreshKey} />
        </aside>
      </div>

      {canEdit && (
        <button
          onClick={() => setShowNew(true)}
          aria-label="Neuer Termin"
          className="brand-gradient-bg fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_4px_24px_rgba(169,112,255,0.5)] lg:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {showNew && (
        <NewAppointmentModal
          salonId={salonId}
          date={view === "week" ? mobileDate : date}
          timezone={dayData?.timezone ?? mobileDayData?.timezone ?? "Europe/Berlin"}
          employees={employees}
          services={services}
          defaultEmployeeId={employees[0]?.id ?? ""}
          defaultStartAt={`${view === "week" ? mobileDate : date}T09:00:00`}
          revalidatePath={basePath}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            load();
            setWeekRefreshKey((k) => k + 1);
            getDayCalendarDataAction(salonId, mobileDate).then(setMobileDayData);
          }}
        />
      )}
    </div>
  );
}
