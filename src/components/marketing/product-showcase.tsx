import Image from "next/image";

export function ProductShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">Dein Dashboard auf einen Blick</h2>
        <p className="mt-3 text-ink-soft">
          Kalender, Anrufe und Termine an einem Ort — so sieht SalonCall AI im Salon-Alltag aus.
        </p>
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-white/70 shadow-[0_1px_2px_rgba(38,34,29,0.04)]">
        <Image
          src="/marketing/dashboard-stats.png"
          alt="SalonCall AI Dashboard-Kopfzeile mit Tagesübersicht: Anrufe, Termine, Neukunden und Terminwert"
          width={1150}
          height={260}
          className="w-full"
          sizes="(min-width: 1024px) 1100px, 100vw"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        <div className="overflow-hidden rounded-3xl border border-border bg-white/70 shadow-[0_1px_2px_rgba(38,34,29,0.04)] lg:col-span-3">
          <Image
            src="/marketing/dashboard-calendar.png"
            alt="SalonCall AI Wochenkalender mit farbcodierten Terminen je Mitarbeiterin"
            width={730}
            height={660}
            className="w-full"
            sizes="(min-width: 1024px) 650px, 100vw"
          />
          <div className="px-6 py-5">
            <h3 className="font-display text-lg text-ink">Ein Kalender für den ganzen Salon</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Jede Mitarbeiterin, jeder Mitarbeiter mit eigener Farbe — Termine der KI landen automatisch dort, ohne Überschneidungen.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-white/70 shadow-[0_1px_2px_rgba(38,34,29,0.04)] lg:col-span-2">
          <Image
            src="/marketing/dashboard-ai-assistant.png"
            alt="KI-Telefonassistent bucht live während des Anrufs einen Termin"
            width={540}
            height={320}
            className="w-full"
            sizes="(min-width: 1024px) 420px, 100vw"
          />
          <div className="px-6 py-5">
            <h3 className="font-display text-lg text-ink">Live dabei, während sie telefoniert</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Du siehst in Echtzeit, worüber die KI gerade spricht und welchen Termin sie vorschlägt.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
