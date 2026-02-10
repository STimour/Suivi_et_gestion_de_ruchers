'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { User, Menu, LogOut, Home, MapPin, Hexagon, Crown, UserPlus, ClipboardList } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authService } from "@/lib/auth/authService";
import { useProfileMode } from "@/lib/context/ProfileModeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EntrepriseSwitcher } from "./EntrepriseSwitcher";
import { ProfileModeSwitcher } from "./ProfileModeSwitcher";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { NotificationPanel } from "./NotificationPanel";

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

export function Header() {
  const { user, logout } = useAuth();
  const { isEleveur } = useProfileMode();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const navItems = isEleveur ? NAV_ELEVAGE : NAV_RUCHERS;
  const title = isEleveur ? 'Elevage de Reines' : 'Gestion de Ruchers';

  useEffect(() => {
    const entrepriseId = user?.entreprise_id;
    if (!entrepriseId) {
      setIsPremium(null);
      return;
    }
    const token = authService.getToken();
    if (!token) {
      setIsPremium(null);
      return;
    }

    let isActive = true;
    const loadStatus = async () => {
      try {
        const status = await authService.getEntrepriseOffreStatus(entrepriseId, token);
        const typeValue = (status?.type || "").toLowerCase();
        const premium = Boolean(status?.paid || typeValue === "premium");
        if (isActive) {
          setIsPremium(premium);
        }
      } catch {
        if (isActive) {
          setIsPremium(null);
        }
      }
    };

    loadStatus();
    return () => {
      isActive = false;
    };
  }, [user?.entreprise_id]);
  return (
  <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left - Navigation */}
          <nav className="hidden lg:flex items-center gap-6 justify-start flex-1">
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  i === 0
                    ? 'text-amber-900 hover:text-amber-600'
                    : 'text-amber-700/70 hover:text-amber-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button - Left on mobile */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
                  <Menu className="h-5 w-5 text-amber-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-white">
                <SheetHeader>
                  <SheetTitle className="text-amber-900">Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 px-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-amber-900 hover:bg-amber-50"
                      >
                        <Icon className="h-4 w-4 text-amber-600" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center - Logo, Title & Switchers */}
          <div className="flex items-center gap-3 justify-center min-w-0">
            <Link href={isEleveur ? '/dashboard/elevage' : '/dashboard'} className="flex items-center gap-2">
              <Image
                src="/logo_ruche_1.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="font-bold text-lg text-amber-900 hidden md:inline truncate">
                {title}
              </span>
            </Link>
            <EntrepriseSwitcher />
            <ProfileModeSwitcher />
            {isPremium !== null && (
              <span
                className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  isPremium
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {isPremium ? "Premium" : "Freemium"}
              </span>
            )}
          </div>

          {/* Right - Notifications & Profile */}
          <div className="flex items-center gap-2 justify-end flex-1">
            {/* Notifications */}
            <NotificationPanel />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5 text-amber-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white">
                {user && (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-amber-900">
                        {user.prenom} {user.nom}
                      </p>
                      <p className="text-xs text-amber-700/70">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Mon profil
                </DropdownMenuItem>
                {user?.entreprise_role === 'AdminEntreprise' && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setInviteDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Inviter un membre
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <InviteMemberDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </header>
  );
}
