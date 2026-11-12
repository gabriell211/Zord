import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
    applicationName: "Zord",
    title: { default: "Zord | Gestão empresarial", template: "%s | Zord" },
    description: "Gestão empresarial moderna, simples e conectada ao seu negócio.",
    robots: { index: false, follow: false },
    icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#f7f8fb",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
