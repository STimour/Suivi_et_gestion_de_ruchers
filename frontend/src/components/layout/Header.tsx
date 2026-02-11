'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Dancing_Script } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Crown, User, Menu, LogOut, UserPlus } from "lucide-react";
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
import { SidebarMobile } from "./Sidebar";

const handwriting = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export function Header() {
  const { user, logout } = useAuth();
  const { isEleveur } = useProfileMode();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const showUpgradeCta = isPremium === false;

  const title = isEleveur ? 'Élevage de Reines' : 'Gestion de Ruchers';

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
      <div className="px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left — Burger (mobile) + ProfileModeSwitcher + EntrepriseSwitcher */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink-0">
            {/* Mobile burger — first on mobile */}
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0" aria-label="Ouvrir le menu">
                    <Menu className="h-5 w-5 text-amber-700" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-white w-64">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                  </SheetHeader>
                  <SidebarMobile onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>

            <ProfileModeSwitcher />
            <EntrepriseSwitcher />
          </div>

          {/* Center — Logo + Title */}
          <Link
            href={isEleveur ? '/dashboard/elevage' : '/dashboard'}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto"
          >
            <Image
              src="/logo_ruche_1.png"
              alt="Logo"
              width={36}
              height={36}
              className="object-contain shrink-0"
            />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-bold text-lg text-amber-900 whitespace-nowrap">
                {title}
              </span>
              <span className="ml-0.5 -mt-0.5">
                <span
                  className={`${handwriting.className} inline-block rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[18px] font-bold tracking-[0.01em] text-amber-800 shadow-[0_2px_8px_rgba(120,53,15,0.2)] rotate-[-3deg]`}
                >
                  Par Abeenage
                </span>
              </span>
            </span>
          </Link>

          {/* Right — Badge + Notifications + Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isPremium !== null && (
              <span
                className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${
                  isPremium
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {isPremium ? "Premium" : "Freemium"}
              </span>
            )}
            {showUpgradeCta && (
              <Button asChild size="sm" className="hidden md:inline-flex bg-green-600 hover:bg-green-700 text-white">
                <Link href="/upgrade-premium">
                  <Crown className="h-4 w-4" />
                  Passer au premium
                </Link>
              </Button>
            )}

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
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                {showUpgradeCta && (
                  <DropdownMenuItem asChild>
                    <Link href="/upgrade-premium" className="cursor-pointer">
                      <Crown className="mr-2 h-4 w-4" />
                      Passer au premium
                    </Link>
                  </DropdownMenuItem>
                )}
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
