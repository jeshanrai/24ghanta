import type { Metadata } from "next";
import { Geist, Martian_Mono } from "next/font/google";
import ClientLayoutWrapper from "./ClientLayoutWrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
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
        className={`${geistSans.variable} ${martianMono.variable} antialiased`}
      >
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
