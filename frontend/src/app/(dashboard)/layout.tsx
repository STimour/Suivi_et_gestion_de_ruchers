'use client';

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar =
    pathname === "/upgrade-premium" ||
    pathname === "/dashboard/profile" ||
    pathname.startsWith("/dashboard/profile/");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-amber-50/30">
        <Header />
        <div className="flex">
          {!hideSidebar && <Sidebar />}
          <main className="flex-1 px-4 py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
