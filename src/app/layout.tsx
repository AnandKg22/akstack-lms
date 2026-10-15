import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AKStack LMS — Multi-Course Engineering Platform",
  description: "Enterprise-grade multi-course Learning Management System with granular access control and curriculum telemetry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
