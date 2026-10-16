import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "WinBack Bot - bring old customers back",
  description: "Win back past customers with one-tap WhatsApp messages. Built for South African tradespeople.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>
        <AppProvider>
          <Nav />
          <main className="mx-auto max-w-3xl space-y-4 px-4 pb-28 pt-4">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
