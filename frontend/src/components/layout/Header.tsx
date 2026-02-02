'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Bell, User, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo_ruche_1.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="font-bold text-lg text-amber-900 hidden md:inline">
            Gestion de Ruchers
          </span>
        </Link>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-6">
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
            href="/dashboard/interventions"
            className="text-sm font-medium text-amber-700/70 hover:text-amber-600 transition-colors"
          >
            Interventions
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5 text-amber-700" />
          </Button>
        </div>
      </div>
    </header>
  );
}
