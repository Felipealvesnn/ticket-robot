import PageWrapper from "@/components/PageWrapper";
import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ticket Robot - WhatsApp Automation",
  description: "Sistema de automação WhatsApp com gestão de tickets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 ml-16 transition-all duration-300 ease-in-out overflow-y-auto">
            <PageWrapper>{children}</PageWrapper>
          </main>
        </div>
      </body>
    </html>
  );
}
