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
  title: "HalloMia",
  description:
    "HalloMia übernimmt Telefonanrufe für Friseursalons – Termine werden automatisch erkannt, geprüft und im eigenen Salon-Kalender gebucht.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
