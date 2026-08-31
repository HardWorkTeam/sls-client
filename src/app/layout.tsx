import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { QueryProvider } from "@/providers/query-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Srolanh Couple Portal",
  description: "Srolanh Digital Event Management — Couple Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </QueryProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
