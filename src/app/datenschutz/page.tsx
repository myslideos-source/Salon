import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = { title: "Datenschutzerklärung – HalloMia" };

export default function DatenschutzPage() {
  return (
    <LegalPageShell title="Datenschutzerklärung">
      <div className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-ink">
        <strong>Hinweis:</strong> Dieser Entwurf beschreibt die tatsächlich eingesetzten Dienste (Stand: technische
        Umsetzung von HalloMia) so genau wie möglich, ersetzt aber keine rechtliche Prüfung. Bitte die
        Platzhalter-Kontaktdaten ausfüllen und vor dem Livegang von einer fachkundigen Person (Anwalt/
        Datenschutzbeauftragter) gegenprüfen lassen – insbesondere die Angaben zu Auftragsverarbeitern und
        Drittlandübermittlungen.
      </div>

      <section>
        <h2 className="font-display text-lg text-ink">1. Verantwortlicher</h2>
        <p className="mt-2">
          [Vollständiger Name / Firma]
          <br />
          [Straße und Hausnummer, PLZ Ort]
          <br />
          E-Mail: [Deine E-Mail-Adresse]
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">2. Übersicht der Verarbeitungen</h2>
        <p className="mt-2">
          HalloMia ist eine Software für Friseursalons: ein KI-Telefonassistent nimmt Anrufe entgegen und bucht
          Termine, die im eigenen Kalender des Salons verwaltet werden. Dabei werden personenbezogene Daten von
          Kundinnen und Kunden der Salons (Anruferinnen/Anrufer) sowie von Salon-Mitarbeitenden verarbeitet.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">3. Welche Daten wir verarbeiten</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Telefonnummer der Anruferin/des Anrufers (zur Kundenerkennung und für Terminbestätigungen)</li>
          <li>Name, gewünschte Leistung, Wunschtermin und Gesprächsinhalt/-verlauf des Anrufs</li>
          <li>Termindaten (Datum, Uhrzeit, gebuchte Leistung, zuständige Mitarbeiterin/zuständiger Mitarbeiter)</li>
          <li>Login-Daten von Salon-Mitarbeitenden (E-Mail-Adresse) zur Anmeldung im Verwaltungsbereich</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">4. Eingesetzte Dienste (Auftragsverarbeiter)</h2>
        <p className="mt-2">
          Zur Erbringung des Dienstes setzen wir folgende Dienstleister ein, die in unserem Auftrag Daten
          verarbeiten:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>Hosting der Anwendung:</strong> Vercel Inc. (USA). Übermittlung in ein Drittland auf Basis von
            EU-Standardvertragsklauseln.
          </li>
          <li>
            <strong>Datenbank:</strong> Supabase, gehostet in der EU (Region Frankfurt/eu-central-1) – Kunden-,
            Termin- und Anrufdaten liegen damit innerhalb der EU.
          </li>
          <li>
            <strong>KI-Telefonassistent:</strong> Retell AI (USA) verarbeitet Gesprächsaudio und wandelt es in Text
            um, um Anfragen zu verstehen und Termine zu buchen. Übermittlung in ein Drittland auf Basis von
            EU-Standardvertragsklauseln.
          </li>
          <li>
            <strong>SMS-Terminbestätigungen (falls aktiviert):</strong> Twilio Inc. (USA) verschickt die
            Bestätigungs-SMS an die Telefonnummer der Kundin/des Kunden. Übermittlung in ein Drittland auf Basis
            von EU-Standardvertragsklauseln.
          </li>
          <li>
            <strong>Browser-Testfunktion (nur für Salon-Betreiber):</strong> OpenAI (USA) wird ausschließlich für
            den optionalen Text-Testmodus im Verwaltungsbereich genutzt, nicht für echte Kundenanrufe.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">5. Rechtsgrundlage</h2>
        <p className="mt-2">
          Die Verarbeitung erfolgt zur Erfüllung eines Vertrags bzw. zur Durchführung vorvertraglicher Maßnahmen
          (Art. 6 Abs. 1 lit. b DSGVO) – nämlich der Terminbuchung, die die Anruferin/der Anrufer selbst
          telefonisch veranlasst.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">6. Speicherdauer</h2>
        <p className="mt-2">
          Termin- und Kundendaten werden gespeichert, solange eine Geschäftsbeziehung mit dem jeweiligen Salon
          besteht bzw. solange gesetzliche Aufbewahrungspflichten bestehen. Anrufmitschnitte/-transkripte werden
          nur so lange vorgehalten, wie es für die Terminabwicklung und etwaige Rückfragen erforderlich ist.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">7. Cookies</h2>
        <p className="mt-2">
          Diese Website und der Verwaltungsbereich verwenden ausschließlich technisch notwendige Cookies –
          konkret ein Session-Cookie, das die Anmeldung im Salon- bzw. Admin-Bereich ermöglicht. Es werden keine
          Analyse-, Marketing- oder Tracking-Cookies eingesetzt.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink">8. Deine Rechte</h2>
        <p className="mt-2">
          Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO),
          Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) sowie Widerspruch
          gegen die Verarbeitung (Art. 21 DSGVO). Wende dich dazu an die oben genannte Kontaktadresse oder direkt
          an den betreffenden Salon. Zudem besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.
        </p>
      </section>
    </LegalPageShell>
  );
}
