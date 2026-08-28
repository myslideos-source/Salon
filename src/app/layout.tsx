import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Bold, rounded geometric sans used app-wide for headings, matching the
// HalloMia mockups (landing page and portal alike).
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HalloMia – Deine KI-Assistentin für Anrufe, Termine und Kundenanfragen",
  description:
    "HalloMia nimmt Anrufe entgegen, beantwortet Fragen und organisiert Termine – rund um die Uhr und passend zu deinem Unternehmen. Für Friseure, Praxen, Handwerksbetriebe, Kanzleien und viele weitere Branchen.",
  keywords: [
    "KI-Telefonassistent",
    "Terminbuchung",
    "virtuelle Rezeption",
    "Anrufbeantworter KI",
    "Kalender-KI",
  ],
  openGraph: {
    title: "HalloMia – Deine KI-Assistentin für Anrufe, Termine und Kundenanfragen",
    description:
      "HalloMia nimmt Anrufe entgegen, beantwortet Fragen und organisiert Termine – rund um die Uhr und passend zu deinem Unternehmen.",
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
