import Image from "next/image";

export function ProductShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">Dein Dashboard auf einen Blick</h2>
        <p className="mt-3 text-ink-soft">
          Kalender, Anrufe und Termine an einem Ort — so sieht HalloMia im Salon-Alltag aus.
        </p>
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-white/[0.04] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <Image
          src="/marketing/dashboard-overview.png"
          alt="HalloMia Dashboard: Tagesübersicht mit Anrufen, Terminen und Neukunden, Wochenkalender je Mitarbeiterin, letzte Anrufe, offene Rückrufe und ein live während des Anrufs gebuchter Termin"
          width={1448}
          height={1086}
          className="w-full"
          sizes="(min-width: 1024px) 1100px, 100vw"
        />
      </div>
    </section>
  );
}
