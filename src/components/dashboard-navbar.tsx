"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  CreditCard,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

interface DashboardNavbarProps {
  user: User;
  onSignOut: () => void;
}

export default function DashboardNavbar({ user, onSignOut }: DashboardNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  const navigationItems = [
    {
      name: "料金プラン",
      href: "/dashboard/subscription",
    },
    {
      name: "チュートリアル",
      href: "/dashboard/tutorial",
    },
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-6 lg:px-12 relative z-10">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center text-2xl font-bold hover:opacity-80 transition-opacity cursor-pointer text-text-primary"
      >
        <img
          src="/logo.png"
          alt="CueMe Logo"
          className="w-10 h-10 mr-2"
          style={{ verticalAlign: "middle" }}
        />
        <span className="logo-text">CueMe</span>
      </Link>

      {/* Navigation Links - Hidden on mobile */}
      <div className="hidden md:flex space-x-8">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-text-primary hover:opacity-70 font-medium transition-opacity ${
              isActive(item.href)
                ? "opacity-100"
                : "opacity-70"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-1 text-text-primary hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent-light text-text-primary">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline font-medium">
              {user.email?.split("@")[0]}
            </span>
            <ChevronDown className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card-light border-card-dark">
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/tutorial")}
              className="hover:bg-subtle-bg"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              チュートリアル
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/subscription")}
              className="hover:bg-subtle-bg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              プラン管理
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-subtle-bg">
              <Settings className="w-4 h-4 mr-2" />
              設定
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 hover:bg-red-50"
              onClick={onSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-text-primary hover:bg-subtle-bg"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-card-dark">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors text-text-primary opacity-70 hover:opacity-100 hover:bg-subtle-bg`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>{item.name}</span>
              </Link>
            ))}
            
            {/* Mobile User Menu */}
            <div className="border-t border-card-dark mt-3 pt-3">
              <div className="flex items-center space-x-3 px-3 py-2 text-text-primary opacity-70">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent-light text-text-primary">
                  <UserIcon className="w-4 h-4" />
                </div>
                <span className="font-medium">
                  {user.email?.split("@")[0]}
                </span>
              </div>
              
              <Link
                href="/dashboard/tutorial"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-primary opacity-70 hover:opacity-100 hover:bg-subtle-bg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BookOpen className="w-4 h-4" />
                <span>チュートリアル</span>
              </Link>
              
              <Link
                href="/dashboard/subscription"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-text-primary opacity-70 hover:opacity-100 hover:bg-subtle-bg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <CreditCard className="w-4 h-4" />
                <span>プラン管理</span>
              </Link>
              
              <button
                className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignOut();
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}