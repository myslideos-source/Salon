> **Hinweis:** Dieser Umsetzungsplan basiert auf `docs/HALLOMIA_UNIVERSAL_KONZEPT.md` und dokumentiert den Ist-Zustand des Projekts sowie einen phasenweisen Weg dorthin. Er wurde rein analytisch erstellt — in diesem Schritt wurden kein Anwendungscode und keine Datenbankstruktur verändert. Build, TypeScript-Prüfung und Lint wurden ausschließlich diagnostisch ausgeführt.

## 1. Aktueller technischer Stand

### 1.1 Tech-Stack & Paketmanager

- **Framework:** Next.js 16.3.3 (App Router, Turbopack), React 19.2.8, TypeScript 5 (strict)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`), eigenes Design-System über CSS-Variablen (`src/app/globals.css`), Icons via `lucide-react`
- **Backend/DB:** Supabase (Postgres, Auth, Realtime, Storage), Zugriff über `@supabase/ssr` und `@supabase/supabase-js`
- **KI/Telefonie:** OpenAI (`openai`, nur für den In-App-Testanruf), Retell (`src/lib/voice/providers/retell.ts`) und ElevenLabs (`src/lib/voice/providers/elevenlabs.ts`) als austauschbare Voice-Provider hinter `src/lib/voice/provider.ts`
- **Validierung:** Zod
- **Datum/Zeit:** `date-fns`, `date-fns-tz`
- **Tests:** Vitest + Testing Library + jsdom (`tests/availability.test.ts` — reine Scheduling-Logik)
- **Paketmanager:** **npm** (nur `package-lock.json` vorhanden, kein yarn.lock/pnpm-lock.yaml)
- **Scripts:** `npm run dev|build|start|lint|test`, `npm run seed` (führt `scripts/seed.ts` aus)

### 1.2 Verzeichnisstruktur (Kurzüberblick)

```
src/app/            Next.js App Router: Landingpage, /admin/*, /app/*, /api/*
src/components/      admin/ · appointments/ · auth/ · brand/ · calendar/ ·
                     calls/ · customers/ · dashboard/ · layout/ · marketing/ ·
                     portal/ · ui/
src/lib/             actions/ (Server Actions) · auth/ · scheduling/ ·
                     sms/ · supabase/ · validation/ · voice/
supabase/            migrations/0001–0013 · seed.sql · tests/rls_and_booking.sql
tests/               availability.test.ts
public/brand/        Logo-Assets (bleiben laut Vorgabe erhalten)
```

### 1.3 Seiten, Routen und Navigation

Es gibt **zwei getrennte Portale** mit eigenem Login und eigener Navigation:

- **`/admin/*`** — Plattform-Admin (HalloMia-Team, „Managed Service"): `dashboard`, `salons`, `salons/[salonId]/{calendar,employees,services,opening-hours,working-hours,customers,calls,ai,settings}`, `leads` (Akquise-Pipeline `sales_leads`), `signups`, `system`.
- **`/app/*`** — Salon-Portal (Kunde/Salon-Mitarbeiter): `dashboard`, `calendar`, `appointments`, `customers/[customerId]`, `calls`, `absences`, `ai`.
- Öffentlich: `/` (Landingpage), `/impressum`, `/datenschutz`.
- API: `/api/voice/webhook` (Retell), `/api/voice/webhook/elevenlabs/{[tool],post-call}`, `/api/calendar/feed.ics` (ICS-Export), `/api/notifications`, `/api/cron/resync-voice-agents`.

Navigation ist in `src/components/layout/sidebar.tsx` (Desktop) und `mobile-nav.tsx` (mobiles Bottom-Nav, horizontal scrollbar, **kein „Mehr"-Menü**, sondern alle Punkte in einer scrollbaren Leiste) implementiert. Die Nav-Items selbst sind bereits generisch benannt (`Übersicht`, `Kalender`, `Termine`, `Kunden`, `Anrufe`, `Abwesenheiten`, `KI-Assistent` in `src/app/app/(portal)/layout.tsx:13-21`); es fehlen aber die im Konzept geforderten Punkte **Anfragen**, **Leistungen** (im Salon-Portal, aktuell nur im Admin-Portal sichtbar) und **Team und Ressourcen** (aktuell nur „Abwesenheiten", kein Mitarbeiter-Self-Service).

### 1.4 Wiederverwendbare Komponenten

Bereits gut vorbereitet und branchenneutral nutzbar:

- `src/components/ui/*` (Button, Card, Badge, Field, Modal, PageLoading) — generisches Design-System, keine Fachlogik.
- `src/components/calendar/*` — **sehr weit entwickelter eigener Kalender**, kein eingebetteter externer Kalender: `calendar-shell.tsx` orchestriert `day-view`, `week-grid`, `month-grid`, `mobile-agenda` + `mobile-date-strip` (echte mobile Tagesansicht mit horizontaler Datumsleiste, nicht die verkleinerte Desktop-Woche — Konzeptanforderung ist hier **bereits erfüllt**), `mini-month-calendar`, `today-appointments-card`, `week-stats-card`, `employee-filter`, `appointment-card`, `appointment-detail-modal`, `new-appointment-modal`. Vorhanden: Tag/Woche/Monat, Heute-Button, Vor/Zurück, aktuelle-Zeit-Linie, Drag-to-Reschedule (Pointer-Events), Farbcodierung nach Leistung/Mitarbeiter, Mitarbeiter-Filter, Realtime-Update via Supabase-Channel mit Ton/Push-Benachrichtigung.
  **Fehlend gegenüber Konzept:** Suche, Filter nach Standort/Terminart/Status, Terminübersicht als reine Liste über den Kalender hinaus (existiert separat unter `/app/appointments` via `appointments-list-view.tsx`, aber nicht als Kalender-Ansicht), Verlängern/Verkürzen eines Termins per Drag (nur Verschieben ist implementiert, keine Resize-Handles).
- `src/components/customers/*`, `src/components/calls/*`, `src/components/appointments/*` — CRUD-Views, strukturell generisch.
- `src/components/admin/*` — Formulare für Mitarbeiter, Leistungen, Öffnungszeiten, Arbeitszeiten, Abwesenheiten, Voice-Settings; funktional bereits recht flexibel (Leistungen haben u. a. Dauer, Preis, Vor-/Nachbereitungszeit, Farbe, Mitarbeiterzuordnung — deckt einen Großteil der Konzept-Anforderung an „Terminarten" bereits ab).

### 1.5 Datenbank, Migrationen und vorhandene Tabellen

13 sequenzielle Migrationen (`supabase/migrations/0001`–`0013`), additiv gewachsen, keine Down-Migrations. Kern-Tabellen (alle mandantenscoped über `salon_id`, außer `platform_admins`, `sales_leads`, `audit_logs`):

| Tabelle | Zweck | Bemerkung |
|---|---|---|
| `platform_admins` | Admin-Allowlist | user_id → auth.users |
| `salons` | **Mandant** (= „Unternehmen") | 1 Zeile = 1 Standort/Unternehmen, kein separates Standort-Konzept |
| `salon_users` | Mitgliedschaft | Rolle nur `owner` \| `staff` |
| `employees`, `employee_working_hours`, `employee_absences` | Personal | einzige „Ressource"-Art; keine Räume/Fahrzeuge/Geräte |
| `services`, `employee_services` | Leistungen/Terminarten | bereits recht flexibel (Dauer, Preis, Puffer, Farbe, Mitarbeiterzuordnung, aktiv/inaktiv) |
| `customers` | Kunden | nur Basisfelder, kein Status/Tags/individuelle Felder |
| `appointments`, `appointment_services` | Termine | Status nur `booked/completed/cancelled/no_show`, Quelle nur `voice_ai/manual/online_booking`; **DB-Exclusion-Constraint** verhindert Doppelbuchung pro Mitarbeiter |
| `calls`, `callback_requests` | Anrufe & Rückrufe | `callback_requests` ist einfach (kein Kategorie/Dringlichkeit/Anhang-Modell wie im Konzept gefordert) |
| `voice_settings` | KI-Konfiguration | pro Salon, mit Retell/ElevenLabs-Feldern, `custom_prompt`, mehreren Verhaltens-Flags (bereits branchenagnostisch erweitert, siehe 0009–0011) |
| `business_hours` | Öffnungszeiten | pro Wochentag, kein Ausnahme-/Feiertagskalender |
| `sales_leads` | Interne Akquise (Admin-only) | nicht mandantenscoped, gehört zum HalloMia-eigenen Vertrieb, nicht zum Kundenprodukt |
| `audit_logs` | Audit-Trail | vorhanden, aber nirgends im UI ausgewertet |

**Fehlend gegenüber Konzept:** `locations` (Standorte), generische `resources` (Räume/Fahrzeuge/Geräte/Tische), `requests` (branchenunabhängige Anfragen mit Kategorie/Dringlichkeit/Anhang), `faq` als eigene Tabelle (aktuell nur `custom_prompt`-Freitext), individuelle Buchungsfragen pro Terminart, individuelle Kundenfelder, Kunden-Tags/-Status, `notifications`-Tabelle (Benachrichtigungen laufen aktuell nur über SMS bei Buchung, siehe `src/lib/notifications/appointment-sms.ts` und `src/app/api/notifications/route.ts`), Branchenvorlagen-Tabelle.

RLS ist vorbildlich umgesetzt (`0002_rls.sql`): `is_platform_admin()` / `is_salon_member()` als `SECURITY DEFINER`-Funktionen, jede Tabelle hat RLS aktiviert, sensible Felder (z. B. `voice_settings.phone_number`, `provider_agent_id`) sind nur per Admin-`UPDATE`-Policy änderbar; Self-Service-Felder laufen bewusst über eng gefasste `SECURITY DEFINER`-RPCs (`toggle_salon_ai`, `update_voice_settings_customer_fields`, `regenerate_calendar_feed_token`) statt über breite `UPDATE`-Policies. Dieses Muster ist die Vorlage für künftige Self-Service-Erweiterungen (siehe Phasenplan).

### 1.6 Authentifizierung und Benutzerverwaltung

Supabase Auth (E-Mail/Passwort). Zwei Sessions-Helper in `src/lib/auth/session.ts`: `requirePlatformAdmin()` und `requireSalonSession()`. Rollen sind aktuell binär (`owner`/`staff` in `salon_users.role`), es gibt **keine** granularen Rollen (Administrator/Empfang/Nur-Kalenderzugriff) und **keine** „nur eigene Termine sehen"-Einschränkung für Mitarbeiter — jeder Salon-User mit Zugriff sieht alle Daten des Salons.

### 1.7 Bestehende Mandantenfähigkeit

Vollständig und sauber über `salon_id` + RLS umgesetzt — Daten verschiedener Salons sind bereits strikt getrennt (siehe `supabase/tests/rls_and_booking.sql`, das genau das prüft). Das Konzept einer mandantenfähigen Architektur ist also **bereits vorhanden**; es muss nicht neu gebaut, sondern auf „ein Unternehmen kann mehrere Standorte/Ressourcen haben" erweitert werden.

### 1.8 Fest eingebaute Friseur-Begriffe und Friseur-Logik

**Wichtig vorab:** Die zentralen Datenfelder für Leistungen/Termine sind bereits branchenneutral benannt (`services`, `appointments`, `employees` — keine Spalten wie `haircut_type` o. Ä.). Die „Friseur-Logik" steckt weniger in starren Datenfeldern als in **drei Kategorien**:

**a) Wording auf Landingpage und in rechtlichen Seiten (reiner Text, geringes Risiko):**
- „Friseursalons" explizit in `src/app/layout.tsx:21` (Meta-Description)
- „Salon-Kalender" in `src/app/page.tsx:35`, `src/components/marketing/demo-animation.tsx:14`, `src/components/marketing/product-showcase.tsx:9`
- „Warum Salons HalloMia lieben", „Salon-Inhaber:innen", „entspannte Salons" in `src/app/page.tsx:254,255,304,346`
- sr-only-H1 „…KI-Telefonassistenz für Friseursalons…" in `src/app/page.tsx:149`
- „Salon-Mitarbeitenden", „Salons (Anruferinnen/Anrufer)" mehrfach in `src/app/datenschutz/page.tsx`
- Preistabelle nennt einen Plan explizit „Salon" (`src/components/marketing/pricing.tsx:19,25,30`)

**b) UI-Text im Admin-/App-Portal, der „Salon" statt „Unternehmen" zeigt (mittleres Risiko, sichtbar für Endkunden):**
- Platzhalter-Anzeigename `avatarLabel={session.email ?? "Salon"}` an sieben Stellen im Salon-Portal (`src/app/app/(portal)/{calendar,dashboard,appointments,absences,customers/[customerId],customers,calls,ai}/page.tsx`)
- Fehlermeldungen „kein Salon hinterlegt" (`src/app/app/login/page.tsx:7`, `src/app/admin/login/page.tsx:8`)
- Admin-Oberfläche komplett „Salon"-zentriert: Navigation „Salons" (`src/app/admin/(portal)/layout.tsx:11`), Seiten „Salons"/„Neuer Salon" (`src/components/admin/new-salon-button.tsx:32,88`, `src/app/admin/(portal)/salons/page.tsx`), „Salon-Status" (`src/components/admin/salon-settings-form.tsx:67`)
- Insgesamt **794 Vorkommen des Substrings „salon"** über 109 Dateien (Variablen-, Typ-, Funktionsnamen wie `SalonMembership`, `ActiveSalon`, `useActiveSalon`, `resolveActiveSalonId`, `salon-context.tsx`, `salon-tabs.tsx`, `SalonProvider`) — der überwiegende Teil davon sind interne Bezeichner, nicht Nutzertext.

**c) Architektonische Annahmen, die über reines Wording hinausgehen (hohes Risiko, betrifft Datenmodell/Rechte):**
- **Ein Salon = eine Ressourcen-Art (Mitarbeiter), ein Standort.** Es gibt keine Tabelle für Räume/Fahrzeuge/Geräte/Tische und keine Standort-Entität — ein Betrieb mit mehreren Filialen oder mit Ressourcen wie „Werkstattbucht" oder „Behandlungsraum" lässt sich heute nicht abbilden.
- **„Managed Service"-Rechtemodell:** RLS erlaubt Salon-Usern nur `SELECT` auf `employees`, `services`, `employee_working_hours`, `business_hours`, `voice_settings` — **Schreiben ist Plattform-Admin-only** (`0002_rls.sql:76-121,171-187`). Das ist eine bewusste Architekturentscheidung des bisherigen Produkts (HalloMia-Team richtet jeden Salon manuell ein), steht aber im direkten Widerspruch zum neuen Konzept, das ein **Self-Service-Onboarding** durch den Unternehmer selbst verlangt (Terminarten, Mitarbeiter, Öffnungszeiten, KI-Konfiguration eigenständig einrichten).
- **Fester Status-/Quellen-Wertebereich** in `appointments.status` (`booked/completed/cancelled/no_show`) und `appointments.source` (`voice_ai/manual/online_booking`) deckt die im Konzept geforderten Zustände (Angefragt, Eingecheckt, In Bearbeitung, Rückruf erforderlich; Quellen Import/Externer Kalender) nicht ab.
- **Rollenmodell** nur `owner`/`staff`, keine feingranularen Rollen und kein „nur eigene Termine"-Scoping.
- Sprachlich ist die KI selbst laut `src/lib/voice/prompt.ts:15` explizit „eine echte Mitarbeiterin am Empfang von [Salonname]" — branchenneutral formulierbar, aber aktuell fix als Empfangs-Rolle beschrieben (passt nicht 1:1 z. B. für Handwerksbetriebe ohne Empfang).
- Demo-/Seed-Daten (`supabase/seed.sql`) bilden ausschließlich einen Friseursalon ab (Damen-/Herrenschnitt, Farbe, Balayage, Bart) — es gibt keine Multi-Branchen-Demodaten.

### 1.9 Aktueller Kalender und Terminabläufe

Bereits im Detail unter 1.4 beschrieben. Buchungsablauf: `src/lib/scheduling/availability.ts` (reine Slot-Berechnung: Öffnungszeiten ∩ Arbeitszeiten − Abwesenheiten − bestehende Termine, Puffer, Vorlaufzeit, max. Vorausbuchung, unit-getestet) → `src/lib/scheduling/engine.ts` (`checkAvailability`, Buchen/Verschieben/Stornieren, jede Buchung wird unmittelbar vor dem Schreiben erneut validiert) → `book_appointment`-RPC + `appointments_no_overlap`-Exclusion-Constraint als harte Datenbankgarantie gegen Doppelbuchung, auch bei gleichzeitigen Anrufen. Diese Kernlogik ist branchenneutral und sollte **nicht** angetastet werden, nur um generische Ressourcen erweitert.

### 1.10 Demo-Daten

Nur ein einziges, vollständig ausgeprägtes Demo-Unternehmen: „Hair Lounge Milano" (3 Mitarbeiter, 6 Leistungen, Öffnungszeiten, Kunden, heutige Termine, Anrufe, Rückrufe) über `supabase/seed.sql`. Kein zweites Demo-Unternehmen, keine andere Branche. `npm run seed` führt zusätzlich `scripts/seed.ts` aus (TypeScript-Variante, nicht im Detail geprüft, aber laut `package.json` vorhanden).

### 1.11 Mobile Darstellung

Bereits deutlich weiter als der Konzeptbrief vermuten lässt: Bottom-Nav (`mobile-nav.tsx`), eigene Mobile-Agenda-Ansicht mit horizontaler Datumsleiste (`mobile-date-strip.tsx`, `mobile-agenda.tsx`) statt verkleinerter Desktop-Woche — **die zentrale Konzeptanforderung „Tagesansicht + horizontale Datumsauswahl auf dem Smartphone" ist bereits erfüllt**. Floating-Action-Button für „Neuer Termin" auf Mobile (`calendar-shell.tsx:381-389`). Nicht geprüft wurden alle Admin-Unterseiten (Tabellen wie `service-employee-matrix.tsx` sind auf kleinen Screens potenziell breiter als der Viewport) — das sollte pro Phase mit echtem Breakpoint-Test verifiziert werden, da hierzu keine automatisierten Tests existieren.

### 1.12 Vorhandene funktionslose Schaltflächen

Keine gefunden. Gezielte Suche nach `TODO`, `FIXME`, „coming soon", „not implemented" sowie leeren `onClick={() => {}}`-Handlern in `src/` ergab **keine Treffer**. Alle Buttons sind funktional an Server Actions oder State angebunden.

### 1.13 TypeScript-, Build- und Lint-Status (diagnostisch geprüft, keine Änderungen vorgenommen)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | ✅ **0 Fehler** |
| Lint | `npx eslint .` | ✅ **0 Fehler**, 1 Warnung (überflüssige `eslint-disable`-Direktive in `src/components/calendar/new-appointment-modal.tsx:60`) |
| Build | `npm run build` | ✅ **Erfolgreich**, alle 28 Routen kompilieren, Typprüfung im Build ebenfalls grün |

**Fazit:** Das Projekt befindet sich in einem sauberen, deploybaren Zustand. Jede Phase des folgenden Plans muss diesen Zustand am Ende erneut erreichen (kein Merge mit roten Checks).

---

## 2. Risiken für bestehende Daten und Funktionen

1. **Exclusion-Constraint an `status = 'booked'` gekoppelt** (`0001_schema.sql:150-153`). Eine Erweiterung des Status-Wertebereichs (z. B. „Angefragt", „Eingecheckt") darf die Doppelbuchungs-Garantie nicht aufweichen — jeder neue Status muss explizit einsortiert werden (blockiert er einen Slot oder nicht?), sonst drohen stille Doppelbuchungen.
2. **RLS-Vertrauensgrenze beim Übergang vom „Managed Service"- zum Self-Service-Modell.** Aktuell dürfen Salon-User `employees`/`services`/`business_hours`/`voice_settings` nur lesen. Self-Service-Onboarding erfordert neue Schreibrechte — falls diese als breite `UPDATE`-Policies statt als eng gefasste `SECURITY DEFINER`-RPCs (Vorbild: `toggle_salon_ai`, `update_voice_settings_customer_fields`) umgesetzt werden, könnten Salon-User versehentlich technische/abrechnungsrelevante Felder ändern (z. B. `voice_settings.phone_number`, `provider_agent_id`, `salons.status`).
3. **Realtime-Publikation & Live-Kalender** (`0006_realtime_appointments.sql`, Channel-Filter `salon_id=eq.${salonId}` in `calendar-shell.tsx:155`). Jede Umbenennung von `salon_id` oder Änderung an `appointments` muss die Publikation und den Client-Filter synchron halten, sonst bleibt der Live-Kalender stumm, ohne dass ein Fehler sichtbar wird.
4. **Sprachagent-Prompt & Tool-Schema** (`src/lib/voice/prompt.ts`, `src/lib/voice/tools.ts`, `boosted-keywords.ts`) sind auf „ein Mitarbeiter, eine Leistung, ein Empfang" zugeschnitten. Neue Konzepte (Ressourcen, Standorte, individuelle Buchungsfragen) müssen in Prompt **und** Tool-JSON-Schemas **und** die Retell-/ElevenLabs-Provider-Adapter gleichzeitig einfließen — ein Auseinanderlaufen führt zu einer KI, die Dinge anbietet, die die Buchungs-Engine nicht mehr abbilden kann (Verstoß gegen die Kernregel „keine Informationen erfinden").
5. **Keine automatisierten Integrationstests außer `tests/availability.test.ts` und dem manuellen SQL-Skript `supabase/tests/rls_and_booking.sql`.** Jede Schema-Änderung an mandantenscoped Tabellen sollte dieses SQL-Skript erneut durchlaufen (Tenant-Isolation + Doppelbuchungs-Constraint sind sonst nicht abgesichert).
6. **Seed-Daten sind produktionsnah dokumentiert** (README verweist auf reale Zugangsdaten-Platzhalter, die vor Produktivbetrieb geändert werden müssen). Neue Multi-Branchen-Demodaten dürfen den bestehenden Seed-Ablauf nicht brechen und keine Klartext-Zugangsdaten einführen.
7. **Zwei parallele Voice-Provider (Retell/ElevenLabs) mit je eigenen Sync-/Webhook-Pfaden** (`src/lib/actions/{retell,elevenlabs}.ts`, `src/app/api/voice/webhook/**`, `src/app/api/cron/resync-voice-agents/route.ts`). Änderungen an `voice_settings` (z. B. neue Spalten für Sprache/Tonalität) müssen für **beide** Provider-Adapter konsistent nachgezogen werden, sonst driftet ein Provider aus dem Sync.
8. **Interne Bezeichner (`salon_id`, `SalonMembership`, Routen `/admin/salons/…`) sind tief im Code verwoben (794 Fundstellen).** Eine vollständige Umbenennung auf „company"/„Unternehmen" ist ein großer, fehleranfälliger Change über RLS-Funktionen, RPCs, Realtime-Publikation, Retell-Webhook-URLs und Storage-Policies hinweg. Dies wird im Phasenplan bewusst als **optionaler Spätschritt mit reduzierter Priorität** eingeordnet (siehe Phase 12) — die Akzeptanzkriterien des Konzepts verlangen sichtbar generische Begriffe im Produkt, nicht zwingend generische interne DB-/Variablennamen.
9. **`sales_leads` und der Admin-Akquise-Bereich (`/admin/leads`, `/admin/signups`) gehören zum internen HalloMia-Vertrieb**, nicht zum Kundenprodukt — dürfen bei der Universalisierung nicht versehentlich mit branchenspezifischer Logik vermischt werden.
10. **Fehlende Mobile-Breakpoint-Tests für dichte Admin-Tabellen** (z. B. `service-employee-matrix.tsx`) — jede Phase, die diese Bereiche berührt, muss manuell auf Smartphone-Breite geprüft werden, da kein visueller Regressionstest existiert.

---

## 3. Priorisierter Phasenplan

Reihenfolge nach Risiko (niedrig → hoch) und Abhängigkeit. Jede Phase ist einzeln deploybar, einzeln testbar und lässt das Projekt in einem grün buildenden Zustand zurück. Migrationsnummern sind Vorschläge (`0014` aufwärts) und additiv — keine bestehende Migration wird verändert.

### Phase 1 — Terminologie-Fundament (reine Konfigurationsebene, kein Rename)
**Status: ✅ umgesetzt (2026-08-27)**, gemeinsam mit einem Teil von Phase 4 (Grundnavigation), siehe Statusnotiz unten.

**Ziel:** Eine zentrale, austauschbare Begriffsebene schaffen, ohne bestehende DB-Spalten oder Routen umzubenennen.
**Vorgehen:** Neues `src/lib/terminology.ts` (bzw. React-Context analog zu `useActiveSalon`) mit Default-Labels „Unternehmen, Kunde, Terminart, Leistung, Mitarbeiter, Ressource, Standort, Anfrage". UI-Komponenten, die aktuell hart „Salon" anzeigen (siehe 1.8b), auf dieses Label-System umstellen.
**Betroffene Dateien:** neue Datei `src/lib/terminology.ts`; alle Stellen aus 1.8b (`avatarLabel={session.email ?? "Salon"}` × 7, Fehlermeldungen in `app/login` und `admin/login`).
**DB:** keine Änderung.
**Prüf-/Akzeptanzkriterien:** `npm run build`, `npx tsc --noEmit`, `npx eslint .` grün; manuelle Sichtprüfung aller betroffenen Seiten (Desktop + Mobile), kein „Salon" mehr als Platzhalter-Text im Salon-Portal sichtbar; bestehende Funktionalität (Login, Fehlermeldungen) unverändert.

**Umsetzungsnotiz (2026-08-27):** Auf expliziten Auftrag wurde diese Phase um die im Konzept beschriebene Grundnavigation erweitert (siehe „Navigation der Anwendung" im Universal-Konzept), da beide Themen zusammen die kleinste sinnvoll abnahmefähige Einheit „Generische Begriffe und Grundnavigation" bilden. Umgesetzt:

- `src/lib/terminology.ts` neu angelegt (zentrale Default-Labels: Unternehmen, Kunde, Terminart, Leistung, Mitarbeiter, Ressource, Standort, Anfrage) und in Navigation, Topbars und Avatar-Fallbacks tatsächlich verwendet (nicht nur deklariert).
- Alle sieben `avatarLabel={session.email ?? "Salon"}`-Stellen sowie die Fehlermeldungen „kein Salon hinterlegt" in `app/login` und `admin/login` auf generische Begriffe umgestellt; „Sicherer Zugang für moderne Friseursalons" im Salon-Login sowie „Salon-Kalender" im Admin-Mitarbeiterformular generalisiert.
- Hauptnavigation des Salon-Portals (`src/app/app/(portal)/layout.tsx`) exakt auf die Konzept-Vorgabe umgestellt: Übersicht, Kalender, Anrufe, Kunden, Anfragen, Meine Mia, Leistungen, Team und Ressourcen, Statistiken, Einstellungen — Desktop-Sidebar und mobile Bottom-Nav teilen sich weiterhin dieselbe `navItems`-Liste (keine Duplikate).
- Fünf neue, an bestehende RLS-Rechte gebundene Seiten ergänzt, damit jeder neue Navigationspunkt zu einer echten, funktionierenden Seite führt statt zu einem funktionslosen Button: `/app/requests` (Anfragen — bestehende `callback_requests` generisch gerahmt, inkl. Status-Aktion), `/app/services` (Leistungen, lesend — Schreibrechte sind laut RLS bis Phase 4 Plattform-Admin-only), `/app/team` (Team und Ressourcen — Mitarbeiterliste lesend + vollständig funktionale Abwesenheitsverwaltung, ersetzt `/app/absences`), `/app/stats` (Statistiken — echte 7-Tage-Kennzahlen aus vorhandenen Tabellen, keine erfundenen Daten) und `/app/settings` (Einstellungen — Unternehmensdaten lesend, funktionierender KI-Aktiv-Schalter, Links zu den übrigen Bereichen).
- `/app/absences` bleibt als Redirect auf `/app/team` erhalten (keine toten Links für bestehende Lesezeichen); `/app/appointments` bleibt unverändert erreichbar über den bestehenden „Listenansicht"-Link im Kalender, ist aber bewusst nicht mehr in der Hauptnavigation, da das Konzept dort keine eigene „Termine"-Position vorsieht.
- Bewusst **nicht** angetastet: Landingpage- und Rechtstexte-Wording (bleibt Phase 2), interne Bezeichner wie `SalonMembership`/`salon_id` (bleibt Phase 16), Schreibrechte für Leistungen/Mitarbeiter (bleibt Phase 4) und jegliche neue Datenbankarchitektur.
- Geprüft: `npx tsc --noEmit`, `npx eslint .` und `npm run build` fehlerfrei (alle 38 Routen kompilieren), `npx vitest run` weiterhin grün. Die Login-Seite wurde per Playwright auf Desktop- und Mobile-Breite visuell verifiziert; ein vollständiger Klick-Durchlauf der neu angemeldeten Seiten war in dieser Sitzung nicht möglich, da keine gültigen Demo-Zugangsdaten für das verbundene Supabase-Projekt vorlagen (die Platzhalter aus `supabase/seed.sql` griffen nicht) — dies sollte vor dem nächsten Schritt mit echten Zugangsdaten nachgeholt werden.

### Phase 2 — Landingpage & rechtliche Seiten universalisieren
**Ziel:** Konzept-Akzeptanzkriterium „Landingpage wirkt nicht mehr wie reine Friseur-Software" erfüllen.
**Vorgehen:** Neue Hero-Headline/Unterzeile gemäß Konzept, Branchen-Karten-Sektion (sechs Branchen + „Weitere Branchen anzeigen"), Ersetzen aller Friseur-spezifischen Formulierungen aus 1.8a durch branchenneutrale bzw. gemischte Beispiele. `datenschutz`/`impressum` sprachlich anpassen („Salon" → „Unternehmen", ohne Rechtsinhalte zu verändern).
**Betroffene Dateien:** `src/app/page.tsx`, `src/app/layout.tsx` (Meta-Description), `src/components/marketing/*`, `src/app/datenschutz/page.tsx`, `src/app/impressum/page.tsx`.
**DB:** keine Änderung.
**Prüf-/Akzeptanzkriterien:** Visuelle Prüfung Desktop/Tablet/Mobile; keine erfundenen Kundennamen/Bewertungszahlen (Konzept-Vorgabe); Build/Lint/TSC grün; bestehende Anchor-Links (`#funktionen` etc.) funktionieren weiter.

### Phase 3 — Branchenvorlagen-Datenmodell (additiv)
**Ziel:** Grundlage für „Branche auswählen → passende Vorschläge" schaffen, ohne bestehende Logik zu verändern.
**Vorgehen:** Neue Migration `0014_industry_templates.sql`: Tabelle `industry_templates` (Schlüssel, Anzeigename, Vorschlags-Terminologie als jsonb, Beispiel-Terminarten als jsonb) + nullable Spalte `salons.industry_template_id`. Nur lesend genutzt, keine bestehende Logik ändert sich, solange die Spalte `null` bleibt.
**Betroffene Dateien/DB:** neue Migration; `src/lib/supabase/database.types.ts` (regenerieren); keine Verbraucherlogik in dieser Phase.
**Prüf-/Akzeptanzkriterien:** Migration lässt sich auf einer Kopie der DB anwenden, ohne bestehende Daten zu verändern; `supabase/tests/rls_and_booking.sql` läuft weiterhin fehlerfrei; Build/TSC grün.

### Phase 4 — Self-Service-Rechte für Terminarten/Mitarbeiter/Öffnungszeiten (RLS-Erweiterung)
**Ziel:** Vom „Managed Service"- zum Self-Service-Modell wechseln (Konzept-Kernanforderung „Unternehmen verwalten alle Einstellungen selbst").
**Vorgehen:** Nach dem bestehenden Muster (`toggle_salon_ai`, `update_voice_settings_customer_fields`) neue `SECURITY DEFINER`-RPCs bzw. gezielt erweiterte `INSERT/UPDATE`-Policies für `services`, `employees`, `employee_working_hours`, `business_hours`, beschränkt auf die Rolle `owner`. Technische/abrechnungsrelevante Felder (`salons.status`, `voice_settings.phone_number/provider_*`) bleiben admin-only. Neue Formulare im Salon-Portal (`/app/services`, `/app/team`) analog zu den bestehenden Admin-Formularen (`src/components/admin/service-form.tsx`, `employee-form.tsx` als Vorlage, keine Duplikation der Komponenten, sondern Wiederverwendung mit Rollen-Prop).
**Betroffene Dateien/DB:** neue Migration `0015_self_service_rls.sql`; neue Seiten `src/app/app/(portal)/services/page.tsx`, `.../team/page.tsx`; Wiederverwendung/Anpassung von `src/components/admin/{service-form,employee-form,opening-hours-form,working-hours-board}.tsx` (ggf. nach `src/components/shared/` verschieben, um Duplikate zu vermeiden); Navigation in `layout.tsx` ergänzen.
**Prüf-/Akzeptanzkriterien:** `supabase/tests/rls_and_booking.sql` weiterhin grün; manueller Test „Salon-User kann Leistung anlegen/ändern, aber nicht `phone_number` in `voice_settings` ändern"; bestehende Admin-Funktionalität unverändert nutzbar (Admin behält vollen Zugriff); Build/TSC/Lint grün; Mobile-Check der neuen Formulare.

### Phase 5 — Erweiterter Onboarding-Assistent
**Ziel:** Schritt-für-Schritt-Einrichtung gemäß Konzept (12 Schritte), aufbauend auf Phase 3+4.
**Vorgehen:** Neuer Onboarding-Flow unter `/app/onboarding/*` mit Fortschrittsbalken und Auto-Save je Schritt (nutzt die in Phase 4 geschaffenen Self-Service-Schreibrechte). Branchenauswahl nutzt `industry_templates` aus Phase 3, inkl. „Andere Branche".
**Betroffene Dateien/DB:** neue Routen unter `src/app/app/onboarding/`; ggf. neue Spalte `salons.onboarding_completed_step` (additiv, nullable/default 0); Wiederverwendung der Formulare aus Phase 4.
**Prüf-/Akzeptanzkriterien:** Kompletter Durchlauf aller 12 Schritte auf Desktop und Smartphone ohne Datenverlust bei Unterbrechung (Reload mitten im Flow); bestehender Login-Weg für Nicht-Onboarding-Nutzer bleibt unverändert; Build/TSC/Lint grün.

### Phase 6 — Terminstatus & Buchungsquellen erweitern
**Ziel:** Status-/Quellen-Wertebereich gemäß Konzept erweitern, ohne die Doppelbuchungs-Garantie zu gefährden (Risiko 1).
**Vorgehen:** Migration, die den `check`-Constraint auf `appointments.status` erweitert (`requested, confirmed, checked_in, in_progress, completed, cancelled, no_show, callback_required` statt nur `booked/completed/cancelled/no_show`) und die Exclusion-Constraint-Bedingung von `status = 'booked'` auf die neue Menge „blockierender" Status (`confirmed, checked_in, in_progress`, ggf. `requested`, zu klären) umstellt; `source` erweitern um `import, external_calendar`. Bestehende Zeilen mit `status = 'booked'` in einem Migrationsschritt auf den neuen äquivalenten Wert (`confirmed`) ummappen.
**Betroffene Dateien/DB:** neue Migration `0016_appointment_status_expansion.sql`; `src/lib/scheduling/engine.ts`, `src/lib/actions/appointments.ts`, alle Kalender-/Listen-Komponenten, die auf `status === "booked"` prüfen (`appointment-card.tsx`, `day-view.tsx:91`, `week-grid.tsx`, `appointments-list-view.tsx`), `src/lib/voice/tools.ts`.
**Prüf-/Akzeptanzkriterien:** `tests/availability.test.ts` weiterhin grün, ggf. um neue Statuswerte ergänzt; `supabase/tests/rls_and_booking.sql`-Äquivalent für Doppelbuchung erneut manuell verifizieren (zwei parallele Buchungsversuche); bestehende Termine nach Migration weiterhin korrekt im Kalender sichtbar; Voice-Buchungsfluss (Testanruf) weiterhin erfolgreich.

### Phase 7 — Flexible Terminarten: individuelle Buchungsfragen
**Ziel:** Konzept-Anforderung „individuelle Buchungsfragen pro Terminart".
**Vorgehen:** Neue Spalte `services.custom_questions jsonb default '[]'`; Formular-Erweiterung in `service-form.tsx`; Übergabe der Fragen an den Voice-Prompt (`src/lib/voice/prompt.ts`) und an die Tool-Schemas (`src/lib/voice/tool-json-schemas.ts`), sodass die KI sie bei Buchung abfragt und die Antworten in `appointments.notes` oder einer neuen `appointment_answers`-Tabelle ablegt.
**Betroffene Dateien/DB:** Migration `0017_service_custom_questions.sql`; `src/components/admin/service-form.tsx` (bzw. das in Phase 4 self-service-fähige Pendant); `src/lib/voice/{prompt,tools,tool-json-schemas}.ts`; `new-appointment-modal.tsx` (manuelle Buchung im Kalender soll dieselben Fragen zeigen).
**Prüf-/Akzeptanzkriterien:** Testanruf (OpenAI Voice Test Mode) stellt die konfigurierte Frage und speichert die Antwort sichtbar am Termin; manuelle Buchung über den Kalender zeigt dieselben Felder; bestehende Terminarten ohne Fragen funktionieren unverändert (leeres Array als Default).

### Phase 8 — Anfragen & Rückrufe als eigenständige Domäne
**Ziel:** Konzept-Bereich „Anfragen" (nicht jeder Kontakt führt zu einem festen Termin).
**Vorgehen:** Neue Tabelle `requests` (Kunde, Anliegen, Kategorie, Beschreibung, Rückrufzeitraum, Dringlichkeit, zuständiger Mitarbeiter, Status gemäß Konzept, interne Notizen), ergänzt `callback_requests` (bleibt als Spezialfall/Verweis bestehen oder wird zu einer Sicht auf `requests` mit Kategorie „Rückruf"). Neue Navigation „Anfragen" im Salon-Portal.
**Betroffene Dateien/DB:** Migration `0018_requests.sql` inkl. RLS-Policies nach bestehendem Muster; neue Seite `src/app/app/(portal)/requests/page.tsx`; neue Komponenten `src/components/requests/*`; Erweiterung `src/lib/voice/tools.ts` um ein `createRequest`-Tool für die KI.
**Prüf-/Akzeptanzkriterien:** Bestehende `callback_requests`-Funktionalität (Anzeige unter „Anrufe") bleibt unverändert nutzbar oder wird sauber migriert (keine Datenverluste — vor Migration Zeilenanzahl prüfen, nach Migration vergleichen); neue Anfragen lassen sich anlegen/bearbeiten/status-wechseln; RLS-Test für Tenant-Isolation der neuen Tabelle.

### Phase 9 — Kundenverwaltung erweitern
**Ziel:** Konzept-Felder Status/Tags/individuelle Felder/Adresse/Einwilligungen.
**Vorgehen:** Additive Spalten auf `customers` (`status`, `tags text[]`, `address`, `company`, `custom_fields jsonb`, `consent_recording boolean`); UI-Erweiterung in `customer-form.tsx`/`customer-profile-view.tsx`; Dubletten-Erkennung (Telefonnummer **und** E-Mail) als Hinweis beim Anlegen ergänzen (aktuell nur `unique (salon_id, phone)` in der DB).
**Betroffene Dateien/DB:** Migration `0019_customer_fields.sql`; `src/components/customers/*`.
**Prüf-/Akzeptanzkriterien:** Bestehende Kundendaten bleiben unverändert lesbar (alle neuen Spalten mit sinnvollem Default); Dublettenwarnung greift bei Test mit bekannter E-Mail, aber neuer Telefonnummer; Build/TSC/Lint grün.

### Phase 10 — Standorte (Locations)
**Ziel:** Ein Unternehmen kann mehrere Standorte haben (Konzept: „Standort optional" bei Terminen, Filter nach Standort im Kalender).
**Vorgehen:** Neue Tabelle `locations` (salon_id, Name, Adresse, Öffnungszeiten-Override); nullable `location_id` auf `employees`, `services`, `appointments`. Bestehende Salons erhalten automatisch einen impliziten Default-Standort (Datenmigration), damit nichts bricht, wenn `location_id` vorerst überall `null`/Default bleibt.
**Betroffene Dateien/DB:** Migration `0020_locations.sql`; `src/components/calendar/employee-filter.tsx` um Standort-Filter ergänzen (bzw. neue `location-filter.tsx`); `calendar-shell.tsx`, `calendar-data.ts`.
**Prüf-/Akzeptanzkriterien:** Bestehende Ein-Standort-Salons funktionieren unverändert (impliziter Default-Standort); neuer Test-Salon mit zwei Standorten zeigt korrekt gefilterte Kalenderdaten; RLS/Tenant-Isolation weiterhin geprüft.

### Phase 11 — Generische Ressourcen (Räume, Fahrzeuge, Geräte, Tische)
**Ziel:** Konzept-Anforderung „buchbare Ressourcen" jenseits von Mitarbeitern.
**Vorgehen:** Neue Tabelle `resources` (Name, Typ, Standort, Verfügbarkeitszeiten, zugewiesene Terminarten, Kalenderfarbe, aktiv/inaktiv) + `appointment_resources`-Verknüpfungstabelle. Verfügbarkeitsprüfung (`src/lib/scheduling/availability.ts`) muss erweitert werden, sodass ein Termin nur angeboten wird, wenn **sowohl** Mitarbeiter **als auch** benötigte Ressourcen frei sind — dies ist der aufwendigste fachliche Teil des gesamten Plans und sollte erst nach Phase 6 (stabiler Status-Wertebereich) und Phase 10 (Standorte) erfolgen.
**Betroffene Dateien/DB:** Migration `0021_resources.sql`; `src/lib/scheduling/availability.ts`, `engine.ts` (neue Parameter, bestehende Signatur möglichst additiv erweitern, nicht brechen); `tests/availability.test.ts` um Ressourcen-Fälle ergänzen; Kalender-UI um Ressourcen-Spalten/-Filter erweitern.
**Prüf-/Akzeptanzkriterien:** Alle bestehenden `tests/availability.test.ts`-Fälle (ohne Ressourcen) weiterhin grün; neue Testfälle für „Ressource belegt → kein Slot" grün; manueller Doppelbuchungstest für Ressourcen analog zum bestehenden Mitarbeiter-Test.

### Phase 12 — Meine Mia: erweiterte KI-Konfiguration & Testchat
**Ziel:** Konzept-Bereich „Meine Mia" vollständig (Name der Assistentin, Du/Sie, weitere Sprachen, „darf niemals nennen", Verhalten außerhalb Öffnungszeiten, Weiterleitung, dringende Fälle).
**Vorgehen:** Additive Spalten auf `voice_settings` (`assistant_name`, `formality` du/Sie, `languages text[]`, `never_mention text`, `after_hours_behavior`, `handoff_number`) nach dem Muster von 0009–0011; Erweiterung von `buildPromptFromConfig`; Ausbau der bestehenden Testanruf-Funktion (`OPENAI_API_KEY`-Pfad) zu einer echten simulierten Chat-Ansicht im „Meine Mia"-Bereich.
**Betroffene Dateien/DB:** Migration `0022_voice_settings_universal.sql`; `src/lib/voice/prompt.ts`, `build-config.ts`; `src/components/portal/ai-settings-form.tsx`; ggf. neue Chat-UI-Komponente.
**Prüf-/Akzeptanzkriterien:** Bestehende Salons ohne neue Felder (Defaults) verhalten sich identisch zu heute (Regressionstest per Testanruf); neue Felder wirken sich nachweislich auf den generierten Prompt aus (Diff-Vergleich); Retell **und** ElevenLabs-Sync bleiben konsistent (Risiko 7).

### Phase 13 — Rollen & Berechtigungen ausbauen
**Ziel:** Konzept-Rollen (Inhaber, Administrator, Mitarbeiter, Empfang, Nur Kalenderzugriff) inkl. „Mitarbeiter sieht nur eigene Termine".
**Vorgehen:** `salon_users.role`-Check-Constraint erweitern; RLS-Policies für `appointments`/`customers` um eine Zeilenfilterung „eigene Termine" ergänzen, wenn Rolle = Mitarbeiter (Vorbild: bestehende `is_salon_member()`-Funktion um eine `is_own_appointment()`-Variante ergänzen); UI-Rechteprüfung in den Server Actions ergänzen (nicht nur clientseitig ausblenden).
**Betroffene Dateien/DB:** Migration `0023_roles.sql`; `src/lib/auth/session.ts`; diverse `src/lib/actions/*.ts` (serverseitige Rechteprüfung).
**Prüf-/Akzeptanzkriterien:** Test je Rolle: Mitarbeiter-Login sieht nur eigene Termine/Kunden, Empfang sieht alles außer Einstellungen, Nur-Kalenderzugriff kann keine Kunden-Stammdaten öffnen; bestehende `owner`/`staff`-Logins verhalten sich weiterhin wie „Inhaber"/„Mitarbeiter" (Abwärtskompatibilität der bestehenden zwei Rollen sicherstellen).

### Phase 14 — Kalender-Feinschliff (Suche, weitere Filter, Resize)
**Ziel:** Restliche Konzept-Anforderungen an den Kalender (Suche, Filter nach Terminart/Status, Verlängern/Verkürzen per Drag).
**Vorgehen:** Erweiterung von `calendar-shell.tsx`/`employee-filter.tsx` um Such-/Terminart-/Status-Filter (client- oder serverseitig, je nach Datenmenge); Resize-Handles in `appointment-card.tsx`/`day-view.tsx` ergänzend zum bestehenden Drag-to-Move.
**Betroffene Dateien/DB:** keine DB-Änderung nötig (nutzt vorhandene/durch Phase 6–11 erweiterte Felder); `src/components/calendar/*`.
**Prüf-/Akzeptanzkriterien:** Bestehendes Drag-to-Reschedule weiterhin funktionsfähig (Regressionstest); neue Filter kombinierbar mit Mitarbeiterfilter; Mobile-Check (Touch-Resize ist auf kleinen Screens ggf. bewusst zu deaktivieren zugunsten der Detail-Ansicht pro Antipattern „keine überladenen Ansichten").

### Phase 15 — Multi-Branchen-Demodaten
**Ziel:** Konzept-Vorgabe „mehrere Demo-Unternehmen, je eigene Branche, nicht vermischt".
**Vorgehen:** Zusätzliche, unabhängig ausführbare Seed-Skripte (`supabase/seed-handwerk.sql`, `seed-arztpraxis.sql`, `seed-restaurant.sql` o. ä. bzw. Erweiterung von `scripts/seed.ts`), die **parallel** zum bestehenden `seed.sql` existieren, ohne es zu verändern oder zu ersetzen.
**Betroffene Dateien/DB:** neue Seed-Dateien; keine Migrationen.
**Prüf-/Akzeptanzkriterien:** Bestehender `seed.sql`-Ablauf weiterhin unverändert lauffähig; neue Seeds erzeugen jeweils ein sauber isoliertes Demo-Unternehmen (RLS-Test: Demo-Unternehmen A sieht keine Daten von Demo-Unternehmen B).

### Phase 16 (optional, niedrige Priorität) — Interne Umbenennung „salon" → „company"/„Unternehmen"
**Ziel:** Auch interne Bezeichner (DB-Spalten, Typnamen, Routen) generisch benennen.
**Empfehlung:** **Nicht zwingend nötig**, um die Akzeptanzkriterien des Konzepts zu erfüllen (diese verlangen sichtbar generische Begriffe im Produkt, siehe Abschnitt 1.8). Aufgrund des hohen Risikos (Risiko 8: 794 Fundstellen, RLS-Funktionen, Realtime-Publikation, Webhook-URLs, Storage-Policies) wird empfohlen, diesen Schritt **nur bei ausdrücklichem separatem Auftrag** und mit einer eigenen, sehr kleinteiligen Sub-Planung (Spalten-Alias/View-basierte Übergangsphase statt Big-Bang-Rename) anzugehen.
**Falls beauftragt — Vorgehen:** schrittweise über SQL-Views/Alias-Spalten, Anwendungscode zuerst auf die neuen Namen umstellen, alte Namen erst nach vollständiger Verifikation entfernen.
**Prüf-/Akzeptanzkriterien:** vollständiger Regressionslauf aller vorherigen Phasen-Akzeptanzkriterien nach dem Rename.

### Phase 17 — Statistiken & Benachrichtigungen ausbauen
**Ziel:** Konzept-Bereiche „Statistiken" und „Benachrichtigungen" vollständig.
**Vorgehen:** Auswertungs-Queries/Views für Buchungsquote, Stornoquote, Rückrufquote, Auslastung je Mitarbeiter, häufigste Anliegen (Auswertung von `calls.topic`/`requests.category`); Benachrichtigungsmatrix (Ereignis × Kanal) auf Basis der in Phase 8 geschaffenen `requests`-Tabelle und der bestehenden `src/app/api/notifications/route.ts`.
**Betroffene Dateien/DB:** ggf. Migration für aggregierende Views; `src/app/app/(portal)/dashboard/page.tsx`, neue Statistik-Seite.
**Prüf-/Akzeptanzkriterien:** Zahlen stimmen mit manueller Kontrollabfrage überein; keine erfundenen Live-Daten (Konzept-Vorgabe) — bei fehlenden Daten explizite „Noch keine Daten"-Anzeige statt Platzhalterzahlen.

---

## 4. Zusammenfassung: Reihenfolge & Abhängigkeiten

```
1 Terminologie → 2 Landingpage → 3 Branchenvorlagen ─┐
                                                      ├─→ 5 Onboarding
                                4 Self-Service-RLS ───┘
6 Status/Quellen erweitern ─→ 11 Ressourcen (setzt Phase 6 + 10 voraus)
7 Buchungsfragen (nach 4)     10 Standorte (nach 6, vor 11)
8 Anfragen (nach 4)           9 Kunden erweitern (unabhängig, jederzeit)
12 Meine Mia (unabhängig)     13 Rollen (unabhängig, aber sinnvoll nach 4)
14 Kalender-Feinschliff (nach 6/10/11, je nach gewünschten Filtern)
15 Demodaten (nach 3, sinnvoll begleitend zu jeder Fach-Phase)
16 Rename (optional, ganz am Ende oder separat beauftragt)
17 Statistiken/Benachrichtigungen (nach 8, 9)
```

Jede Phase soll einzeln committet, einzeln gebaut/getestet und erst danach gemergt werden — es wird ausdrücklich davon abgeraten, mehrere Phasen parallel im selben Arbeitsschritt umzusetzen (siehe Hinweis zu Beginn dieses Dokuments und der Produktspezifikation).
