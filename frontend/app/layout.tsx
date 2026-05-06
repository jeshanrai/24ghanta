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

import { AdSlot } from "@/components/ads";
import { fetchAd } from "@/lib/api";

export const metadata: Metadata = {
  title: "24Ghanta - Breaking News, Latest Headlines & Live Updates",
  description: "Get the latest news, breaking stories, and live updates from India and around the world. 24Ghanta brings you comprehensive coverage of politics, sports, entertainment, business, and more.",
  keywords: "news, breaking news, India news, live updates, politics, sports, entertainment, business",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const popupAd = await fetchAd('popup_landing');

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${martianMono.variable} antialiased`}
      >
        <ClientLayoutWrapper popupAd={popupAd}>
          <div className="flex flex-col min-h-screen">
            {/* Header Ad */}
            <div className="container pt-4 flex justify-center">
              <div className="w-full max-w-[728px]">
                <AdSlot
                  placement="header_banner"
                  className="my-2"
                  aspectClassName="aspect-[728/90]"
                />
              </div>
            </div>

            <div className="flex-1">
              {children}
            </div>

            {/* Footer Ad */}
            <div className="container pb-10 flex justify-center mt-auto">
              <div className="w-full max-w-[728px]">
                <AdSlot
                  placement="footer_banner"
                  aspectClassName="aspect-[728/90]"
                />
              </div>
            </div>
          </div>
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
