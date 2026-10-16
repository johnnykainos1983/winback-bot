import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WinBack Bot",
    short_name: "WinBack",
    description: "Win back past customers with one-tap WhatsApp messages. Built for South African tradespeople.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#0f1b2d",
    background_color: "#0f1b2d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
