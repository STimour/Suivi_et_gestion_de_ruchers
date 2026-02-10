'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Hexagon, Crown, ClipboardList } from "lucide-react";
import { useProfileMode } from "@/lib/context/ProfileModeContext";
import { ProfileModeSwitcher } from "./ProfileModeSwitcher";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Home };

const NAV_RUCHERS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/apiaries', label: 'Ruchers', icon: MapPin },
  { href: '/dashboard/hives', label: 'Ruches', icon: Hexagon },
  { href: '/dashboard/reines', label: 'Reines', icon: Crown },
  { href: '/dashboard/interventions', label: 'Interventions', icon: ClipboardList },
];

const NAV_ELEVAGE: NavItem[] = [
  { href: '/dashboard/elevage', label: 'Dashboard', icon: Home },
  { href: '/dashboard/reines', label: 'Reines', icon: Crown },
  { href: '/dashboard/interventions', label: 'Interventions', icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isEleveur } = useProfileMode();

  const navItems = isEleveur ? NAV_ELEVAGE : NAV_RUCHERS;

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/elevage') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-amber-100 bg-white min-h-[calc(100vh-4rem)]">
      {/* Mode switcher */}
      <div className="px-3 pt-4 pb-2 border-b border-amber-100">
        <ProfileModeSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-amber-100 text-amber-900"
                  : "text-amber-700/70 hover:bg-amber-50 hover:text-amber-900"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", active ? "text-amber-700" : "text-amber-500")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-amber-100">
        <p className="text-xs text-amber-600/60">© 2026 Abeenage</p>
      </div>
    </aside>
  );
}

/** Version mobile dans un Sheet / drawer */
export function SidebarMobile({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isEleveur } = useProfileMode();

  const navItems = isEleveur ? NAV_ELEVAGE : NAV_RUCHERS;

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/elevage') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col">
      {/* Mode switcher */}
      <div className="px-3 pt-3 pb-2 border-b border-amber-100">
        <ProfileModeSwitcher />
      </div>

      <nav className="flex flex-col gap-1 px-2 py-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-amber-100 text-amber-900"
                : "text-amber-700/70 hover:bg-amber-50 hover:text-amber-900"
            )}
          >
            <Icon className={cn("h-4.5 w-4.5", active ? "text-amber-700" : "text-amber-500")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
    </div>
  );
}
