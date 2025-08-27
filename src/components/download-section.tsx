'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Monitor, Smartphone, Laptop, ExternalLink, CheckCircle } from "lucide-react"

interface Release {
  tag_name: string
  name: string
  published_at: string
  assets: Array<{
    name: string
    browser_download_url: string
    size: number
    download_count: number
  }>
}

interface PlatformInfo {
  name: string
  icon: React.ReactNode
  detected: boolean
  downloads: Array<{
    name: string
    url: string
    size: string
    type: string
  }>
}

export default function DownloadSection() {
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [userPlatform, setUserPlatform] = useState<string>('')

  // Detect user platform
  useEffect(() => {
    const platform = navigator.platform.toLowerCase()
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (platform.includes('mac') || userAgent.includes('mac')) {
      setUserPlatform('mac')
    } else if (platform.includes('win') || userAgent.includes('windows')) {
      setUserPlatform('windows')
    } else if (platform.includes('linux') || userAgent.includes('linux')) {
      setUserPlatform('linux')
    } else {
      setUserPlatform('unknown')
    }
  }, [])

  // Fetch latest release from GitHub
  useEffect(() => {
    const fetchLatestRelease = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/itsukison/CueMe2/releases/latest')
        if (response.ok) {
          const data = await response.json()
          setRelease(data)
        }
      } catch (error) {
        console.error('Failed to fetch release:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestRelease()
  }, [])

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getPlatformDownloads = (platform: string): Array<{name: string, url: string, size: string, type: string}> => {
    if (!release) return []
    
    const platformAssets = release.assets.filter(asset => {
      const name = asset.name.toLowerCase()
      switch (platform) {
        case 'mac':
          return name.includes('mac') || name.includes('darwin') || name.endsWith('.dmg')
        case 'windows':
          return name.includes('win') || name.endsWith('.exe') || name.endsWith('.msi')
        case 'linux':
          return name.includes('linux') || name.endsWith('.appimage') || name.endsWith('.deb')
        default:
          return false
      }
    })

    return platformAssets.map(asset => ({
      name: asset.name,
      url: asset.browser_download_url,
      size: formatFileSize(asset.size),
      type: asset.name.split('.').pop()?.toUpperCase() || 'FILE'
    }))
  }

  const platforms: PlatformInfo[] = [
    {
      name: 'macOS',
      icon: <Laptop className="w-6 h-6" />,
      detected: userPlatform === 'mac',
      downloads: getPlatformDownloads('mac')
    },
    {
      name: 'Windows',
      icon: <Monitor className="w-6 h-6" />,
      detected: userPlatform === 'windows',
      downloads: getPlatformDownloads('windows')
    },
    {
      name: 'Linux',
      icon: <Smartphone className="w-6 h-6" />,
      detected: userPlatform === 'linux',
      downloads: getPlatformDownloads('linux')
    }
  ]

  const getRecommendedDownload = () => {
    const platform = platforms.find(p => p.detected)
    if (platform && platform.downloads.length > 0) {
      return platform.downloads[0] // Return first (usually installer)
    }
    return null
  }

  const recommendedDownload = getRecommendedDownload()

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
        <p className="mt-4 text-gray-600">最新バージョンを確認中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Download Section */}
      {recommendedDownload && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm mb-4">
            <CheckCircle className="w-4 h-4" />
            {platforms.find(p => p.detected)?.name} を検出しました
          </div>
          
          <Button 
            className="bg-black text-white hover:bg-gray-900 rounded-full px-8 py-4 text-lg flex items-center gap-3 mx-auto"
            onClick={() => window.open(recommendedDownload.url, '_blank')}
          >
            <Download className="w-5 h-5" />
            CueMe をダウンロード
            <span className="text-sm opacity-80">({recommendedDownload.size})</span>
          </Button>
          
          {release && (
            <p className="mt-2 text-sm text-gray-600">
              バージョン {release.tag_name} • {new Date(release.published_at).toLocaleDateString('ja-JP')}
            </p>
          )}
        </div>
      )}

      {/* All Platforms Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <Card key={platform.name} className={`relative ${platform.detected ? 'ring-2 ring-black' : ''}`}>
            {platform.detected && (
              <div className="absolute -top-2 -right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                推奨
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {platform.icon}
                <h3 className="text-lg font-semibold">{platform.name}</h3>
              </div>
              
              {platform.downloads.length > 0 ? (
                <div className="space-y-2">
                  {platform.downloads.map((download, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-between text-left"
                      onClick={() => window.open(download.url, '_blank')}
                    >
                      <div>
                        <div className="font-medium">{download.type}</div>
                        <div className="text-xs text-gray-500">{download.size}</div>
                      </div>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">このプラットフォーム用のダウンロードは準備中です</p>
              )}
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

      {/* Release Notes Link */}
      {release && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            className="text-gray-600 hover:text-black"
            onClick={() => window.open(`https://github.com/itsukison/CueMe2/releases/tag/${release.tag_name}`, '_blank')}
          >
            リリースノートを見る
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}