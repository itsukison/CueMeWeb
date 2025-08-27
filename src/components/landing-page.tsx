'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowDown,
  Brain,
  Zap,
  Target,
  ChevronDown,
  Globe,
  CheckCircle,
  Users,
  TrendingUp,
  Shield,
  Download,
  Play,
  MessageSquare,
  Star
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7EE' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 relative z-10">
        {/* Logo */}
        <div className="text-2xl font-bold" style={{ color: '#013220' }}>
          CueMe
        </div>

        {/* Navigation Links - Hidden on mobile */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="space-x-8">
            <NavigationMenuItem>
              <NavigationMenuLink className="text-black hover:text-gray-700 font-medium">
                機能
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="text-black hover:text-gray-700 font-medium">
                料金
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="text-black hover:text-gray-700 font-medium">
                サポート
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="text-black hover:text-gray-700 font-medium">
                会社概要
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-1 text-black hover:text-gray-700">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">日本語</span>
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>日本語</DropdownMenuItem>
              <DropdownMenuItem>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Contact Link */}
          <a href="#" className="text-black hover:text-gray-700 font-medium hidden sm:inline">
            お問い合わせ
          </a>

          {/* Login Link */}
          <Link href="/login" className="text-black hover:text-gray-700 font-medium hidden sm:inline">
            ログイン
          </Link>

          {/* CTA Button */}
          <Link href="/login">
            <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-6">
              無料で始める
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-12 lg:px-12 lg:py-20 pb-32 md:pb-48 lg:pb-64">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Top Badge */}
          <div className="mb-6">
            <Button
              variant="outline"
              className="rounded-full border-2 border-black text-black hover:bg-black hover:text-white px-6 py-2"
            >
              面接成功率85%を実現 →
            </Button>
          </div>

          {/* Main Headline - Coda Style */}
          <div className="mb-6">
            <p className="text-lg text-gray-600 mb-3 font-medium">あなたの面接、成功へ導く。</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black mb-3 leading-[0.9] tracking-tight">
              YOUR INTERVIEW
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-[0.9] tracking-tight">
              <span style={{ color: '#013220' }}>YOUR WAY</span>
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed">
            一つのソリューション。無限の成功可能性。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-8 py-3 text-lg flex items-center gap-2">
              <Download className="w-5 h-5" />
              無料ダウンロード
            </Button>
            <Button variant="outline" className="rounded-full px-8 py-3 text-lg flex items-center gap-2 border-black text-black hover:bg-black hover:text-white">
              <Play className="w-5 h-5" />
              デモを見る
            </Button>
          </div>

          {/* Down Arrow */}
          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-gray-600 animate-bounce" />
          </div>
        </div>

        {/* Background Green Shape */}
        <div
          className="absolute -bottom-20 left-0 right-0 h-40 md:h-56 lg:h-72 rounded-t-[50px] md:rounded-t-[100px]"
          style={{ backgroundColor: '#013220' }}
        />
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 lg:px-12 lg:py-32" style={{ backgroundColor: '#013220' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              世界で最も信頼される<br />
              <span className="text-green-300">面接対策ツール</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              グローバルマーケットプレイスで、あなたの可能性を最大化。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all rounded-2xl">
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">AI質問生成</h3>
                <p className="text-gray-300">
                  業界・職種に特化した質問をAIが自動生成。実際の面接で聞かれる質問を網羅的に練習できます。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all rounded-2xl">
              <CardContent className="p-8 text-center">
                <Zap className="w-12 h-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">リアルタイム支援</h3>
                <p className="text-gray-300">
                  面接中にリアルタイムで回答のヒントを表示。緊張していても適切な回答ができるようサポートします。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all rounded-2xl">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">パーソナライズ</h3>
                <p className="text-gray-300">
                  あなたの経歴や志望企業に合わせてカスタマイズ。より効果的な面接対策が可能です。
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-300 mb-2">90%+</div>
              <div className="text-gray-300">面接通過率向上</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-300 mb-2">50K+</div>
              <div className="text-gray-300">成功事例</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-300 mb-2">24/7</div>
              <div className="text-gray-300">サポート体制</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-300 mb-2">100%</div>
              <div className="text-gray-300">満足度保証</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - The Funky Part You Liked */}
      <section className="px-6 py-20 lg:px-12 lg:py-32" style={{ backgroundColor: '#F7F7EE' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-black mb-8 leading-tight">
              CueMeが<br />
              <span style={{ color: '#013220' }}>100万人に</span><br />
              選ばれる理由
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto">
              グローバルマーケットプレイスで、あなたのオーディエンスリーチを加速。
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: '#f0f9f0', color: '#013220' }}>
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">田中 美咲</h4>
                    <p className="text-gray-600 text-sm">マーケティング職</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gray-400" style={{ fill: '#013220' }} />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  「CueMeのおかげで、第一志望の企業に内定をもらえました。AIが生成する質問の精度が驚くほど高く、実際の面接でも同じような質問が出ました。」
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: '#f0f9f0', color: '#013220' }}>
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">佐藤 健太</h4>
                    <p className="text-gray-600 text-sm">エンジニア職</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gray-400" style={{ fill: '#013220' }} />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  「技術面接の対策が特に素晴らしい。コーディング問題から設計問題まで、幅広くカバーしてくれるので、自信を持って面接に臨めました。」
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: '#f0f9f0', color: '#013220' }}>
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">山田 花子</h4>
                    <p className="text-gray-600 text-sm">営業職</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gray-400" style={{ fill: '#013220' }} />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  「面接が苦手でしたが、CueMeで練習を重ねることで、自然に話せるようになりました。リアルタイム支援機能が特に心強かったです。」
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mt-40 mb-10 items-center">
            <div className="ml-15">
              <h3 className="text-3xl md:text-4xl font-bold text-black mb-6">
                面接成功への確実なステップ
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">面接通過率向上</h4>
                    <p className="text-gray-600">平均して面接通過率が40%向上</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">不安の軽減</h4>
                    <p className="text-gray-600">十分な準備により面接への不安を大幅に軽減</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">時間効率</h4>
                    <p className="text-gray-600">効率的な学習で準備時間を50%短縮</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mr-15">
              <Card className="text-center p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-0">
                  <Users className="w-8 h-8 mx-auto mb-3" style={{ color: '#013220' }} />
                  <div className="text-2xl font-bold text-black">100K+</div>
                  <div className="text-gray-600">利用者数</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-0">
                  <TrendingUp className="w-8 h-8 mx-auto mb-3" style={{ color: '#013220' }} />
                  <div className="text-2xl font-bold text-black">85%</div>
                  <div className="text-gray-600">成功率</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-0">
                  <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: '#013220' }} />
                  <div className="text-2xl font-bold text-black">100%</div>
                  <div className="text-gray-600">安全性</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-0">
                  <Target className="w-8 h-8 mx-auto mb-3" style={{ color: '#013220' }} />
                  <div className="text-2xl font-bold text-black">24/7</div>
                  <div className="text-gray-600">サポート</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-20 lg:px-12 lg:py-32" style={{ backgroundColor: '#013220' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            ストアを超えた。<br />
            <span className="text-green-300">グローバル成長の</span><br />
            プラットフォーム。
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            より速く構築し、より多く収益化し、インスタントWebストアで収益エンジンを始動させましょう。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-10 py-4 text-lg font-semibold flex items-center gap-2">
              <Download className="w-5 h-5" />
              今すぐ始める
            </Button>
            <Button variant="outline" className="rounded-full px-10 py-4 text-lg font-semibold text-white border-white hover:bg-white hover:text-black">
              詳細を見る
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 lg:px-12" style={{ backgroundColor: '#F7F7EE' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="text-2xl font-bold mb-4" style={{ color: '#013220' }}>
                CueMe
              </div>
              <p className="text-gray-600">
                AI面接対策ツールで、あなたの転職を成功に導きます。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-4">製品</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-black transition-colors">機能一覧</a></li>
                <li><a href="#" className="hover:text-black transition-colors">料金プラン</a></li>
                <li><a href="#" className="hover:text-black transition-colors">企業向け</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-black transition-colors">ヘルプセンター</a></li>
                <li><a href="#" className="hover:text-black transition-colors">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-black transition-colors">コミュニティ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-4">会社情報</h3>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-black transition-colors">会社概要</a></li>
                <li><a href="#" className="hover:text-black transition-colors">プライバシー</a></li>
                <li><a href="#" className="hover:text-black transition-colors">利用規約</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 mt-12 pt-8 text-center text-gray-600">
            <p>&copy; 2024 CueMe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}