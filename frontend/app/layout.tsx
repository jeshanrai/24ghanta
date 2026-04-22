import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, TrendingBar, Footer } from "@/components/layout";
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
  title: "24Ghanta - Breaking News, Latest Headlines & Live Updates",
  description: "Get the latest news, breaking stories, and live updates from India and around the world. 24Ghanta brings you comprehensive coverage of politics, sports, entertainment, business, and more.",
  keywords: "news, breaking news, India news, live updates, politics, sports, entertainment, business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <TrendingBar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
