import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../app/globals.css";
import { SideNav } from "@/components/SideNav";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CKT Hardware Inventory",
  description: "Hardware inventory management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-screen bg-[#f6f7fb] flex font-sans overflow-hidden">
        <SideNav />
        <div className="app-content-shell flex-1 flex flex-col overflow-hidden pt-16 lg:pt-0">
          <div className="app-scroll-area flex-1 overflow-y-auto">
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
