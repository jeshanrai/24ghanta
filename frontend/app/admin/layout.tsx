"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, LayoutDashboard, FileText, Settings, ExternalLink, Menu, BarChart3, Video, Tag, UserPen, Mail, Vote, TrendingUp } from "lucide-react";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";

type AdminRole = "admin" | "author";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole>("admin");
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginRoute) { setChecking(false); return; }
    const token = localStorage.getItem("24ghanta_admin_token");
    const username = localStorage.getItem("24ghanta_admin_user");
    const storedRole = localStorage.getItem("24ghanta_admin_role");
    if (!token) { router.push("/admin/login"); return; }
    const resolvedRole: AdminRole = storedRole === "author" ? "author" : "admin";
    setUser(username);
    setRole(resolvedRole);

    // Authors don't get access to admin-only sections — redirect them home.
    const adminOnlyPrefixes = ["/admin/categories", "/admin/tags", "/admin/authors", "/admin/subscribers", "/admin/polls", "/admin/trending", "/admin/settings"];
    if (resolvedRole === "author" && adminOnlyPrefixes.some(p => pathname === p || pathname.startsWith(p + "/"))) {
      router.replace("/admin");
      return;
    }

    setChecking(false);
  }, [router, isLoginRoute, pathname]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Initial check
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  function handleLogout() {
    localStorage.removeItem("24ghanta_admin_token");
    localStorage.removeItem("24ghanta_admin_user");
    localStorage.removeItem("24ghanta_admin_role");
    localStorage.removeItem("24ghanta_admin_id");
    router.push("/admin/login");
  }

  if (isLoginRoute) return <><ConfirmDialogProvider />{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  const adminNav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/articles", label: "Articles", icon: FileText },
    { href: "/admin/videos", label: "Videos", icon: Video },
    { href: "/admin/tags", label: "Tags", icon: Tag },
    { href: "/admin/authors", label: "Authors", icon: UserPen },
    { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
    { href: "/admin/polls", label: "Polls", icon: Vote },
    { href: "/admin/trending", label: "Trending Bar", icon: TrendingUp },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];
  const authorNav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/articles", label: "My Articles", icon: FileText },
    { href: "/admin/videos", label: "My Videos", icon: Video },
  ];
  const navItems = role === "author" ? authorNav : adminNav;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-20 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed h-full z-30 flex flex-col bg-white border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:translate-x-0 md:w-20"}
      `}>
        <div className="h-16 flex items-center px-4 border-b border-gray-100 shrink-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 mr-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors hidden md:block shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Mobile close button (optional, but good for UX) */}
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-2 mr-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:hidden shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className={`flex items-center gap-2 overflow-hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 w-0"}`}>
            <Image
              src="/24ghantalogo.jpg"
              alt="24 Ghanta"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg shrink-0"
              priority
            />
            <span className="font-bold text-gray-900 tracking-tight whitespace-nowrap">
              24Ghanta<span className="text-red-600">CMS</span>
            </span>
          </div>
        </div>
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/admin") || (item.href === "/admin" && pathname === "/admin");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden ${isActive ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-r-full" />}
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"} transition-colors`} />
                <span className={`font-medium text-sm whitespace-nowrap transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`
        flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full
        ${sidebarOpen ? "md:ml-64" : "md:ml-20"}
        ml-0
      `}>
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu in Header */}
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 -ml-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-gray-900 tracking-tight md:hidden">
              24Ghanta<span className="text-red-600">CMS</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" target="_blank" className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <ExternalLink className="w-4 h-4" /><span>View Site</span>
            </Link>
            <div className="hidden sm:block w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-red-100 to-red-200 border border-red-300 flex items-center justify-center font-bold text-red-700 shadow-sm shrink-0">
                {user ? user.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-semibold text-gray-900 leading-none">{user}</p>
                <p className="text-gray-500 text-xs mt-1">{role === "author" ? "Author" : "Administrator"}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 ml-1 sm:ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
      <ConfirmDialogProvider />
    </div>
  );
}
