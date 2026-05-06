"use client";

import { usePathname } from "next/navigation";
import { Header, TrendingBar, Footer } from "@/components/layout";
import { AdPopup } from "@/components/ui";

export default function ClientLayoutWrapper({
  children,
  popupAd,
}: {
  children: React.ReactNode;
  popupAd: any;
}) {
  const pathname = usePathname();

  // Do not render Header, TrendingBar, and Footer if the route starts with /admin
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <main>{children}</main>;
  }

  return (
    <>
      <AdPopup ad={popupAd} />
      <Header />
      <TrendingBar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
