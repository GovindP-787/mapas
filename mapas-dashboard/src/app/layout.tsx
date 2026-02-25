import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "MAPAS Mission Control",
  description: "Advanced Drone Telemetry & Control Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn("font-sans bg-black text-slate-100 antialiased")}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
