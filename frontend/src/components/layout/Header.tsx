'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { User, Menu, LogOut, UserPlus } from "lucide-react";
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

export function Header() {
  const { user, logout } = useAuth();
  const { isEleveur } = useProfileMode();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left — Mobile burger + Logo + Title (centered on desktop) */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile burger */}
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
                    <Menu className="h-5 w-5 text-amber-700" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-white w-64">
                  <SheetHeader>
                    <SheetTitle className="text-amber-900">Navigation</SheetTitle>
                  </SheetHeader>
                  <SidebarMobile onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo + Title */}
            <Link href={isEleveur ? '/dashboard/elevage' : '/dashboard'} className="flex items-center gap-2 min-w-0">
              <Image
                src="/logo_ruche_1.png"
                alt="Logo"
                width={36}
                height={36}
                className="object-contain shrink-0"
              />
              <span className="font-bold text-lg text-amber-900 hidden sm:inline truncate">
                {title}
              </span>
            </Link>
          </div>

          {/* Center — Switchers */}
          <div className="flex items-center gap-2">
            <EntrepriseSwitcher />
            <ProfileModeSwitcher />
          </div>

          {/* Right — Badge + Notifications + Profile */}
          <div className="flex items-center gap-2 justify-end flex-1">
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
