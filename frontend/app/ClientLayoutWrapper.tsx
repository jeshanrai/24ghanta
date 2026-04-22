"use client";

import { usePathname } from "next/navigation";
import { Header, TrendingBar, Footer } from "@/components/layout";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Do not render Header, TrendingBar, and Footer if the route starts with /admin
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && (
        <>
          <Header />
          <TrendingBar />
        </>
      )}
      
      <main className={!isAdminRoute ? "min-h-screen" : ""}>
        {children}
      </main>

      {!isAdminRoute && <Footer />}
    </>
  );
}
