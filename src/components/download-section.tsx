"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Monitor,
  Smartphone,
  Laptop,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
    download_count: number;
  }>;
}

interface PlatformInfo {
  name: string;
  icon: React.ReactNode;
  detected: boolean;
  downloads: Array<{
    name: string;
    url: string;
    size: string;
    type: string;
  }>;
}

export default function DownloadSection() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlatform, setUserPlatform] = useState<string>("");

  // Detect user platform
  useEffect(() => {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    if (platform.includes("mac") || userAgent.includes("mac")) {
      setUserPlatform("mac");
    } else if (platform.includes("win") || userAgent.includes("windows")) {
      setUserPlatform("windows");
    } else if (platform.includes("linux") || userAgent.includes("linux")) {
      setUserPlatform("linux");
    } else {
      setUserPlatform("unknown");
    }
  }, []);

  // Fetch latest release from GitHub
  useEffect(() => {
    const fetchLatestRelease = async () => {
      try {
        const owner = process.env.NEXT_PUBLIC_ELECTRON_REPO_OWNER || "itsukison";
        const repo = process.env.NEXT_PUBLIC_ELECTRON_REPO_NAME || "CueMe2";
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/releases/latest`
        );
        if (response.ok) {
          const data = await response.json();
          setRelease(data);
        }
      } catch (error) {
        console.error("Failed to fetch release:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestRelease();
  }, []);

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getFileType = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.endsWith(".appimage")) return "AppImage";
    if (name.endsWith(".dmg")) return "DMG";
    if (name.endsWith(".exe")) return "EXE";
    if (name.endsWith(".msi")) return "MSI";
    if (name.endsWith(".deb")) return "DEB";
    if (name.endsWith(".zip")) return "ZIP";
    if (name.endsWith(".tar.gz")) return "TAR.GZ";
    return filename.split(".").pop()?.toUpperCase() || "FILE";
  };

  const getPlatformDownloads = useCallback(
    (
      platform: string
    ): Array<{ name: string; url: string; size: string; type: string }> => {
      if (!release) return [];

      const platformAssets = release.assets.filter((asset) => {
        const name = asset.name.toLowerCase();
        switch (platform) {
          case "mac":
            return (
              name.includes("mac") ||
              name.includes("darwin") ||
              name.endsWith(".dmg") ||
              name.endsWith("-mac.zip")
            );
          case "windows":
            return (
              name.includes("win") ||
              name.endsWith(".exe") ||
              name.endsWith(".msi") ||
              name.includes("setup")
            );
          case "linux":
            return (
              name.includes("linux") ||
              name.endsWith(".appimage") ||
              name.endsWith(".deb") ||
              name.endsWith(".tar.gz")
            );
          default:
            return false;
        }
      });

      return platformAssets.map((asset) => ({
        name: asset.name,
        url: asset.browser_download_url,
        size: formatFileSize(asset.size),
        type: getFileType(asset.name),
      }));
    },
    [release]
  );

  const platforms: PlatformInfo[] = useMemo(
    () => [
      {
        name: "macOS",
        icon: <Laptop className="w-6 h-6" />,
        detected: userPlatform === "mac",
        downloads: getPlatformDownloads("mac"),
      },
      {
        name: "Windows",
        icon: <Monitor className="w-6 h-6" />,
        detected: userPlatform === "windows",
        downloads: getPlatformDownloads("windows"),
      },
      {
        name: "Linux",
        icon: <Smartphone className="w-6 h-6" />,
        detected: userPlatform === "linux",
        downloads: getPlatformDownloads("linux"),
      },
    ],
    [userPlatform, getPlatformDownloads]
  );

  const getRecommendedDownload = () => {
    const platform = platforms.find((p) => p.detected);
    if (platform && platform.downloads.length > 0) {
      return platform.downloads[0]; // Return first (usually installer)
    }

    // Fallback: if no platform-specific download but release exists, show first available
    if (release && release.assets.length > 0) {
      const firstAsset = release.assets[0];
      return {
        name: firstAsset.name,
        url: firstAsset.browser_download_url,
        size: formatFileSize(firstAsset.size),
        type: getFileType(firstAsset.name),
      };
    }

    return null;
  };

  const recommendedDownload = getRecommendedDownload();

  // Debug: log release data (moved before any conditional returns)
  useEffect(() => {
    if (release) {
      console.log("Release data:", release);
      console.log("Assets:", release.assets);
      console.log("User platform:", userPlatform);
      console.log(
        "Platform downloads:",
        platforms.map((p) => ({ name: p.name, downloads: p.downloads }))
      );
    }
  }, [release, userPlatform, platforms]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
        <p className="mt-4 text-gray-600">最新バージョンを確認中...</p>
      </div>
    );
  }

  // If no release is available, show fallback download options
  if (!release) {
    return (
      <div className="space-y-8">
        {/* Fallback Download Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm mb-4">
            <CheckCircle className="w-4 h-4" />
            最新版をダウンロード
          </div>

          <Button
            className="bg-black text-white hover:bg-gray-900 rounded-full px-8 py-4 text-lg flex items-center gap-3 mx-auto"
            onClick={() => {
              const owner = process.env.NEXT_PUBLIC_ELECTRON_REPO_OWNER || "itsukison";
              const repo = process.env.NEXT_PUBLIC_ELECTRON_REPO_NAME || "CueMe2";
              window.open(`https://github.com/${owner}/${repo}/releases`, "_blank");
            }}
          >
            <Download className="w-5 h-5" />
            CueMe をダウンロード
          </Button>

          <p className=" text-sm text-gray-600">
            GitHubリリースページから最新版をダウンロードできます
          </p>
        </div>

        {/* Platform Cards with Fallback */}
        <div className="grid md:grid-cols-3 gap-6">
          {(() => {
            const owner = process.env.NEXT_PUBLIC_ELECTRON_REPO_OWNER || "itsukison";
            const repo = process.env.NEXT_PUBLIC_ELECTRON_REPO_NAME || "CueMe2";
            const url = `https://github.com/${owner}/${repo}/releases`;
            return [
              { name: "macOS", icon: <Laptop className="w-6 h-6" />, url },
              { name: "Windows", icon: <Monitor className="w-6 h-6" />, url },
              { name: "Linux", icon: <Smartphone className="w-6 h-6" />, url },
            ];
          })().map((platform) => (
            <Card key={platform.name}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {platform.icon}
                  <h3 className="text-lg font-semibold">{platform.name}</h3>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-between text-left"
                  onClick={() => window.open(platform.url, "_blank")}
                >
                  <div>
                    <div className="font-medium">ダウンロード</div>
                    <div className="text-xs text-gray-500">GitHubから</div>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Requirements */}
        <Card className="bg-gray-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">システム要件</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">macOS</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• macOS 10.15 以降</li>
                  <li>• Intel または Apple Silicon</li>
                  <li>• 100MB の空き容量</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Windows</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Windows 10 以降</li>
                  <li>• x64 アーキテクチャ</li>
                  <li>• 100MB の空き容量</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Linux</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Ubuntu 18.04 以降</li>
                  <li>• x64 アーキテクチャ</li>
                  <li>• 100MB の空き容量</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Link */}
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-black"
            onClick={() =>
              window.open("https://github.com/itsukison/CueMe2", "_blank")
            }
          >
            GitHubで詳細を見る
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // If no platform-specific downloads but release exists, show all available downloads
  const allDownloads = release
    ? release.assets.map((asset) => ({
        name: asset.name,
        url: asset.browser_download_url,
        size: formatFileSize(asset.size),
        type: getFileType(asset.name),
      }))
    : [];

  const hasAnyDownloads = platforms.some((p) => p.downloads.length > 0);

  return (
    <div className="space-y-8">
      {/* Quick Download Section */}
      {recommendedDownload ? (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm mb-4">
            <CheckCircle className="w-4 h-4" />
            {platforms.find((p) => p.detected && p.downloads.length > 0)?.name
              ? `${platforms.find((p) => p.detected)?.name} を検出しました`
              : "利用可能なダウンロード"}
          </div>

          <Button
            className="bg-black text-white hover:bg-gray-900 rounded-full px-8 py-4 text-lg flex items-center gap-3 mx-auto"
            onClick={() => window.open(recommendedDownload.url, "_blank")}
          >
            <Download className="w-5 h-5" />
            CueMe をダウンロード
            <span className="text-sm opacity-80">
              ({recommendedDownload.size})
            </span>
          </Button>

          {release && (
            <p className="mt-2 text-sm text-gray-600">
              バージョン {release.tag_name} •{" "}
              {new Date(release.published_at).toLocaleDateString("ja-JP")}
            </p>
          )}
        </div>
      ) : !hasAnyDownloads && allDownloads.length > 0 ? (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm mb-4">
            <CheckCircle className="w-4 h-4" />
            利用可能なダウンロード
          </div>

          <Button
            className="bg-black text-white hover:bg-gray-900 rounded-full px-8 py-4 text-lg flex items-center gap-3 mx-auto"
            onClick={() => window.open(allDownloads[0].url, "_blank")}
          >
            <Download className="w-5 h-5" />
            CueMe をダウンロード
            <span className="text-sm opacity-80">({allDownloads[0].size})</span>
          </Button>

          {release && (
            <p className="mt-2 text-sm text-gray-600">
              バージョン {release.tag_name} •{" "}
              {new Date(release.published_at).toLocaleDateString("ja-JP")}
            </p>
          )}
        </div>
      ) : null}

      {/* Simplified: hide platform grids; provide a link to all releases */}
      {release && (
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-black -mt-15"
            onClick={() => {
              const owner = process.env.NEXT_PUBLIC_ELECTRON_REPO_OWNER || "itsukison";
              const repo = process.env.NEXT_PUBLIC_ELECTRON_REPO_NAME || "CueMe2";
              window.open(`https://github.com/${owner}/${repo}/releases`, "_blank");
            }}
          >
            すべてのダウンロードを見る
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* System Requirements */}
      <Card className="bg-gray-50 -mt-5">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">システム要件</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">macOS</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• macOS 10.15 以降</li>
                <li>• Intel または Apple Silicon</li>
                <li>• 100MB の空き容量</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Windows</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Windows 10 以降</li>
                <li>• x64 アーキテクチャ</li>
                <li>• 100MB の空き容量</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Linux</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Ubuntu 18.04 以降</li>
                <li>• x64 アーキテクチャ</li>
                <li>• 100MB の空き容量</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Release Notes Link */}
      {release && (
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-black"
            onClick={() => {
              const owner = process.env.NEXT_PUBLIC_ELECTRON_REPO_OWNER || "itsukison";
              const repo = process.env.NEXT_PUBLIC_ELECTRON_REPO_NAME || "CueMe2";
              window.open(`https://github.com/${owner}/${repo}/releases/tag/${release.tag_name}`, "_blank");
            }}
          >
            リリースノートを見る
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
