import type { Metadata } from "next";
import { Fraunces, Inter, Poppins } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Bold, rounded geometric sans for the public marketing site (landing page,
// Impressum/Datenschutz) to match the dark HalloMia mockup - scoped to
// those pages only via the `.theme-landing` class in globals.css, so the
// authenticated app/admin portal keeps using Fraunces untouched.
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
    <html
      lang="de"
      className={`${fraunces.variable} ${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
