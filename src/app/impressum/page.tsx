import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = { title: "Impressum – HalloMia" };

export default function ImpressumPage() {
  return (
    <LegalPageShell title="Impressum">
      <div className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-ink">
        <strong>Hinweis:</strong> Die mit eckigen Klammern markierten Angaben unten sind Platzhalter. Bitte durch
        deine echten, ladungsfähigen Angaben ersetzen, bevor die Seite live geht – ein unvollständiges Impressum
        ist in Deutschland abmahnfähig.
      </div>

      <section>
        <h2 className="font-display text-lg text-ink">Angaben gemäß § 5 DDG</h2>
        <p className="mt-2">
          [Vollständiger Name / Firma]
          <br />
          [Straße und Hausnummer]
          <br />
          [Postleitzahl und Ort]
          <br />
          [Land]
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">Kontakt</h2>
        <p className="mt-2">
          Telefon: [Deine Telefonnummer]
          <br />
          E-Mail: [Deine E-Mail-Adresse]
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">Umsatzsteuer-ID</h2>
        <p className="mt-2">
          [Falls vorhanden: Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz. Falls du
          Kleinunternehmer nach § 19 UStG bist, kannst du stattdessen schreiben: „Gemäß § 19 UStG wird keine
          Umsatzsteuer berechnet.“]
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p className="mt-2">
          [Vollständiger Name]
          <br />
          [Straße und Hausnummer]
          <br />
          [Postleitzahl und Ort]
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">EU-Streitschlichtung</h2>
        <p className="mt-2">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr/" className="text-bronze-dark hover:underline" target="_blank" rel="noreferrer">
            https://ec.europa.eu/consumers/odr/
          </a>
          . Unsere E-Mail-Adresse findest du oben unter Kontakt.
        </p>
        <p className="mt-2">
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">Haftung für Inhalte</h2>
        <p className="mt-2">
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
          allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
          forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>
      </section>
    </LegalPageShell>
  );
}
