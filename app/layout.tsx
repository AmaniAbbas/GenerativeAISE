import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { CurrencyProvider } from "@/context/CurrencyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpendSmart — Expense Tracker",
  description: "Track your personal expenses with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-slate-50 antialiased">
        <CurrencyProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
              {children}
            </div>
          </div>
        </CurrencyProvider>
      </body>
    </html>
  );
}
