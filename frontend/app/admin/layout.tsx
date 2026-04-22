"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, FileText, Settings, ExternalLink, Menu, Bell, Search, ShieldCheck, BarChart3, Users, Video } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginRoute) {
      setChecking(false);
      return;
    }
    const token = localStorage.getItem("24ghanta_admin_token");
    const username = localStorage.getItem("24ghanta_admin_user");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setUser(username);
    setChecking(false);
  }, [router, isLoginRoute, pathname]);

  function handleLogout() {
    localStorage.removeItem("24ghanta_admin_token");
    localStorage.removeItem("24ghanta_admin_user");
    router.push("/admin/login");
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/articles", label: "Articles", icon: FileText },
    { href: "/admin/videos", label: "Videos", icon: Video },
    { href: "/admin/categories", label: "Categories", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] fixed h-full z-20 overflow-hidden flex flex-col`}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 mr-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className={`flex items-center gap-2 overflow-hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 w-0"}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0">
               <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight whitespace-nowrap">
               24Ghanta<span className="text-red-600">Admin</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden ${
                  isActive 
                    ? "bg-red-50 text-red-600" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"} transition-colors`} />
                <span className={`font-medium text-sm whitespace-nowrap transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 lg:hidden"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between px-6 lg:px-8">
          
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 sm:text-sm transition-all"
                placeholder="Search..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
            >
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
              <span className="hidden sm:inline">View Site</span>
            </Link>
            
            <div className="w-px h-6 bg-gray-200 mx-1" />
            
            <div className="flex items-center gap-3 ml-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center font-bold text-gray-600 shadow-sm">
                {user ? user.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-semibold text-gray-900 leading-none">{user}</p>
                <p className="text-gray-500 text-xs mt-1">Administrator</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 w-full max-w-7xl mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
