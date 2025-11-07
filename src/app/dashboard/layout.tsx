"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
  Download,
} from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleDownloadCueMe = async () => {
    // Show confirmation dialog
    const confirmed = confirm(
      "CueMeアプリの最新バージョンをダウンロードしますか?\n\nダウンロードが開始されます。"
    );

    if (!confirmed) return;

    try {
      // Fetch latest release from GitHub
      const owner = process.env.NEXT_PUBLIC_ELECTRON_REPO_OWNER || "itsukison";
      const repo = process.env.NEXT_PUBLIC_ELECTRON_REPO_NAME || "CueMe2";
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`
      );

      if (response.ok) {
        const data = await response.json();
        
        // Detect user platform
        const platform = navigator.platform.toLowerCase();
        const userAgent = navigator.userAgent.toLowerCase();
        let downloadUrl = "";

        if (platform.includes("mac") || userAgent.includes("mac")) {
          // Find .dmg file for macOS
          const dmgAsset = data.assets.find((asset: any) =>
            asset.name.toLowerCase().endsWith(".dmg")
          );
          if (dmgAsset) {
            downloadUrl = dmgAsset.browser_download_url;
          }
        } else if (platform.includes("win") || userAgent.includes("windows")) {
          // Find .exe or .msi file for Windows
          const winAsset = data.assets.find((asset: any) =>
            asset.name.toLowerCase().endsWith(".exe") ||
            asset.name.toLowerCase().endsWith(".msi")
          );
          if (winAsset) {
            downloadUrl = winAsset.browser_download_url;
          }
        } else if (platform.includes("linux") || userAgent.includes("linux")) {
          // Find .AppImage file for Linux
          const linuxAsset = data.assets.find((asset: any) =>
            asset.name.toLowerCase().endsWith(".appimage")
          );
          if (linuxAsset) {
            downloadUrl = linuxAsset.browser_download_url;
          }
        }

        // If platform-specific file found, download it
        if (downloadUrl) {
          window.open(downloadUrl, "_blank");
        } else {
          // Fallback to releases page
          window.open(`https://github.com/${owner}/${repo}/releases/latest`, "_blank");
        }
      } else {
        // Fallback to releases page if API call fails
        const owner = process.env.NEXT_PUBLIC_ELECTRON_REPO_OWNER || "itsukison";
        const repo = process.env.NEXT_PUBLIC_ELECTRON_REPO_NAME || "CueMe2";
        window.open(`https://github.com/${owner}/${repo}/releases/latest`, "_blank");
      }
    } catch (error) {
      console.error("Failed to download:", error);
      // Fallback to releases page on error
      const owner = process.env.NEXT_PUBLIC_ELECTRON_REPO_OWNER || "itsukison";
      const repo = process.env.NEXT_PUBLIC_ELECTRON_REPO_NAME || "CueMe2";
      window.open(`https://github.com/${owner}/${repo}/releases/latest`, "_blank");
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (!user) {
        router.push("/login");
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      } else if (event === "SIGNED_IN") {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <div className="text-lg font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Navbar - Matching Landing Page Style */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 relative z-10">
        {/* Logo */}
        <div className="flex items-center text-2xl font-bold text-text-primary">
          <img
            src="/logo.png"
            alt="CueMe Logo"
            className="w-10 h-10 mr-2"
            style={{ verticalAlign: "middle" }}
          />
          <span className="logo-text">CueMe</span>
          <span className="ml-3 text-sm font-medium text-gray-600 bg-card-dark px-3 py-1 rounded-full">
            ダッシュボード
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-1 text-text-primary hover:text-gray-700">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent-light text-text-primary">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline font-medium">
                {user.email?.split("@")[0]}
              </span>
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDownloadCueMe}>
                <Download className="w-4 h-4 mr-2" />
                CueMeをダウンロード
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/tutorial")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                チュートリアル
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/subscription")}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                プラン管理
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                設定
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout Button */}
          <Button
            onClick={handleSignOut}
            className="bg-text-primary text-white hover:bg-gray-900 rounded-full px-6"
          >
            ログアウト
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-2 px-6 lg:px-12">
        {children}
      </main>
    </div>
  );
}
