import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import Nav from "@/components/Nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";


const display = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-barlow-condensed", display: "swap" });
const sans = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-barlow", display: "swap" });

export const metadata: Metadata = {
  title: "WinBack Bot - bring old customers back",
  description: "Win back past customers with one-tap WhatsApp messages. Built for South African tradespeople.",
  applicationName: "WinBack Bot",
  appleWebApp: { capable: true, title: "WinBack", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }], apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f1b2d" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-hivis focus:px-4 focus:py-2 focus:font-bold">
          Skip to content
        </a>
        <ServiceWorkerRegister />
        <TooltipProvider>
          <AppProvider>
            <Nav />
            <main id="main" className="page-in mx-auto max-w-3xl space-y-5 px-4 pb-20 pt-6">
              {children}
            </main>
          </AppProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
