'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Bell, User, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntrepriseSwitcher } from "./EntrepriseSwitcher";

export function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 items-center h-16 gap-4">
          {/* Left - Navigation */}
          <nav className="hidden md:flex items-center gap-6 justify-start">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-amber-900 hover:text-amber-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/apiaries"
              className="text-sm font-medium text-amber-700/70 hover:text-amber-600 transition-colors"
            >
              Ruchers
            </Link>
            <Link
              href="/dashboard/hives"
              className="text-sm font-medium text-amber-700/70 hover:text-amber-600 transition-colors"
            >
              Ruches
            </Link>
            <Link
              href="/dashboard/reines"
              className="text-sm font-medium text-amber-700/70 hover:text-amber-600 transition-colors"
            >
              Reines
            </Link>
            <Link
              href="/dashboard/interventions"
              className="text-sm font-medium text-amber-700/70 hover:text-amber-600 transition-colors"
            >
              Interventions
            </Link>
          </nav>

          {/* Mobile Menu Button - Left on mobile */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5 text-amber-700" />
            </Button>
          </div>

          {/* Center - Logo, Title & Entreprise Switcher */}
          <div className="flex items-center gap-3 justify-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo_ruche_1.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="font-bold text-lg text-amber-900 hidden sm:inline">
                Gestion de Ruchers
              </span>
            </Link>
            <EntrepriseSwitcher />
          </div>

          {/* Right - Notifications & Profile */}
          <div className="flex items-center gap-2 justify-end">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-amber-700" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

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
                <DropdownMenuSeparator />
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
    </header>
  );
}
