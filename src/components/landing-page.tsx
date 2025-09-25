"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Star,
  Eye,
  EyeOff,
  FileText,
  Mic,
} from "lucide-react";
import Link from "next/link";
import DownloadSection from "./download-section";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [dragPosition, setDragPosition] = useState(50); // Percentage from left
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const container = e.currentTarget.getBoundingClientRect();
    let newPos = ((e.clientX - container.left) / container.width) * 100;
    newPos = Math.max(0, Math.min(100, newPos)); // clamp 0–100
    setDragPosition(newPos);
  };

  useEffect(() => {
    const handleMouseUpWindow = () => setIsDragging(false);
    window.addEventListener("mouseup", handleMouseUpWindow);
    return () => window.removeEventListener("mouseup", handleMouseUpWindow);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F7EE" }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center text-2xl font-bold hover:opacity-80 transition-opacity cursor-pointer"
          style={{ color: "#013220" }}
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
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="space-x-8">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/ai-interview" className="text-black hover:text-gray-700 font-medium">
                  AI面接対策
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/blog" className="text-black hover:text-gray-700 font-medium">
                  面接対策ブログ
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a href="#pricing" className="text-black hover:text-gray-700 font-medium">
                  料金
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a href="#support" className="text-black hover:text-gray-700 font-medium">
                  サポート
                </a>
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
          <Link
            href="/contact"
            className="text-black hover:text-gray-700 font-medium hidden sm:inline"
          >
            お問い合わせ
          </Link>

          {/* Login Link */}
          <Link
            href="/login"
            className="text-black hover:text-gray-700 font-medium hidden sm:inline"
          >
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

          {/* Main Headline - SEO Optimized */}
          <div className="mb-6">
            <p className="text-lg text-gray-600 mb-3 font-medium">
              誰にも気づかれず、会話の裏で支える
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-black mb-3 leading-[0.9] tracking-tight">
              見えない会話アシスト
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-[0.9] tracking-tight">
              <span style={{ color: "#013220" }}>CueMe</span>
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed">
            面接も、商談も、日常の会話も。あなたを密かに支える、次世代のリアルタイムAI
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              className="bg-black text-white hover:bg-gray-900 rounded-full px-8 py-3 text-lg flex items-center gap-2"
              onClick={() => {
                const downloadSection =
                  document.getElementById("download-section");
                downloadSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Download className="w-5 h-5" />
              無料ダウンロード
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-8 py-3 text-lg flex items-center gap-2 border-black text-black hover:bg-black hover:text-white"
            >
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
          style={{ backgroundColor: "#013220" }}
        />
      </section>

      {/* Secret Bar Section */}
      <section
        className="px-6 py-20 lg:px-12 lg:py-32 relative overflow-hidden"
        style={{ backgroundColor: "#013220" }}
      >
        <div className="max-w-6xl -mt-30 mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <EyeOff className="w-8 h-8 text-green-300" />
                <span className="text-lg font-semibold text-green-300">
                  完全に隠密
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                あなただけの
                <br />
                <span className="text-green-300">秘密のツールバー</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                画面共有では見えない、あなただけの秘密のインターフェース。面接官には一切気づかれることなく、リアルタイムでAIサポートを受けられます。
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-gray-300">画面共有で見えない隠密設計</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-gray-300">Zoom・Teams・Google Meet対応</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-gray-300">ワンクリックで瞬時にアクセス</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 border-white/20 backdrop-blur-sm rounded-3xl p-12 relative overflow-hidden">
                <div
                  className="relative w-full h-96 cursor-col-resize select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                >
                  {/* Other person's screen */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-medium bg-white rounded-xl overflow-hidden">
                    <span className="text-center">
                      面接官の画面
                      <br />
                      <span className="text-sm">（CueMeは見えません）</span>
                    </span>
                  </div>

                  {/* Your screen */}
                  <div
                    className="absolute inset-0 bg-white rounded-xl flex items-center justify-center overflow-hidden"
                    style={{
                      clipPath: `inset(0 0 0 ${dragPosition}%)`,
                    }}
                  >
                    <img
                      src="/bar.png"
                      alt="CueMe Secret Toolbar"
                      className="max-h-full w-auto"
                    />
                  </div>

                  {/* Divider bar (fixed size) */}
                  <div
                    className="absolute top-0 h-full w-1 bg-gray-400 cursor-col-resize hover:bg-gray-600 transition-colors z-10"
                    style={{
                      left: `${dragPosition}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                      <div className="w-1 h-3 bg-white rounded-full mr-0.5"></div>
                      <div className="w-1 h-3 bg-white rounded-full ml-0.5"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-gray-300 text-sm">
                    バーをドラッグして比較してください - あなたの画面にだけCueMeが表示されます
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* Audio Input Section */}
      <section
        className="px-6 py-20 lg:px-12 lg:py-32"
        style={{ backgroundColor: "#F7F7EE" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Mic className="w-8 h-8" style={{ color: "#013220" }} />
                <span className="text-lg font-semibold" style={{ color: "#013220" }}>
                  音声入力対応
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
                話すだけで
                <br />
                <span style={{ color: "#013220" }}>完璧な準備</span>
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                AIが会話の中から質問を自動検出し、あなたに最適な<br />回答を準備します。自然な対話で面接対策が完了。
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold" style={{ color: "#013220" }}>1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-2">自動質問検出</h4>
                    <p className="text-gray-600">会話から面接質問を自動で識別・抽出</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold" style={{ color: "#013220" }}>2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-2">パーソナライズ回答</h4>
                    <p className="text-gray-600">あなたの経歴に基づいた最適な回答を自動生成</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold" style={{ color: "#013220" }}>3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-2">リアルタイム処理</h4>
                    <p className="text-gray-600">話した内容を瞬時に分析して最適な回答を生成</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <img
                src="/livequestion.png"
                alt="CueMe Live Question Detection"
                className="w-full h-auto rounded-2xl scale-140"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Q&A Preparation Section */}
      <section
        className="px-6 py-20 lg:px-12 lg:py-32"
        style={{ backgroundColor: "#013220" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-green-300" />
              <span className="text-lg font-semibold text-green-300">
                カスタム準備
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              あなたの経歴で
              <br />
              <span className="text-green-300">完全カスタマイズ</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              履歴書、職務経歴書、志望動機などをアップロードして、あなた専用のAI面接対策を構築。
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
  <div className="bg-green-100/70 p-2 rounded-3xl border-2 border-green-200/50 backdrop-blur-sm shadow-lg shadow-green-900/10 max-w-md mx-auto scale-98">
    <img
      src="/mode.png"
      alt="CueMe Document Management"
      className="w-full h-auto rounded-2xl"
    />
  </div>

  <div className="bg-green-100/70 p-2 rounded-3xl border-2 border-green-200/50 backdrop-blur-sm shadow-lg shadow-green-900/10">
    <img
      src="/qnaedit.png"
      alt="CueMe Q&A Editing"
      className="w-full h-auto rounded-2xl"
    />
  </div>
</div>


          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-300/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  ドキュメント登録
                </h3>
                <p className="text-gray-300 text-sm">
                  履歴書や職務経歴書をアップロードして、AIがあなたの経歴を学習
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-300/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  Q&A自動生成
                </h3>
                <p className="text-gray-300 text-sm">
                  あなたの経歴に基づいて、予想される質問と最適な回答を自動生成
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-300/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  カスタム編集
                </h3>
                <p className="text-gray-300 text-sm">
                  生成された回答を自由に編集して、あなたらしい表現に調整
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

     

      {/* Chat Interface Section */}
      <section
        className="px-6 -mt-20 py-20 lg:px-12 lg:py-32"
        style={{ backgroundColor: "#013220" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-green-100/70 p-2 rounded-3xl border-2 border-green-200/50 backdrop-blur-sm shadow-lg shadow-green-900/10">
              <img
                src="/chat.png"
                alt="CueMe Chat Interface"
                className="w-full h-auto rounded-2xl"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-8 h-8 text-green-300" />
                <span className="text-lg font-semibold text-green-300">
                  リアルタイム対話
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                面接中も
                <br />
                <span className="text-green-300">AIが即座に回答</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                面接官の質問をリアルタイムで分析し、あなたの準備した回答や新しい質問に対する最適な答えを瞬時に提供します。
              </p>
              
              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-300/20 rounded-full flex items-center justify-center">
                        <Brain className="w-6 h-6 text-green-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">質問の自動認識</h4>
                        <p className="text-gray-300 text-sm">面接官の質問を音声・テキストで瞬時に認識</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-300/20 rounded-full flex items-center justify-center">
                        <Target className="w-6 h-6 text-green-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">最適回答の生成</h4>
                        <p className="text-gray-300 text-sm">あなたの経歴に基づいた自然で説得力のある回答を生成</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - The Funky Part You Liked */}
      <section
        className="px-6 py-20 lg:px-12 lg:py-32"
        style={{ backgroundColor: "#F7F7EE" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-black mb-8 leading-tight">
              CueMeが
              <br />
              <span style={{ color: "#013220" }}>100万人に</span>
              <br />
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
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                    style={{ backgroundColor: "#f0f9f0", color: "#013220" }}
                  >
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">田中 美咲</h4>
                    <p className="text-gray-600 text-sm">マーケティング職</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-gray-400"
                      style={{ fill: "#013220" }}
                    />
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
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                    style={{ backgroundColor: "#f0f9f0", color: "#013220" }}
                  >
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">佐藤 健太</h4>
                    <p className="text-gray-600 text-sm">エンジニア職</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-gray-400"
                      style={{ fill: "#013220" }}
                    />
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
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                    style={{ backgroundColor: "#f0f9f0", color: "#013220" }}
                  >
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">山田 花子</h4>
                    <p className="text-gray-600 text-sm">営業職</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-gray-400"
                      style={{ fill: "#013220" }}
                    />
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
                    <p className="text-gray-600">
                      十分な準備により面接への不安を大幅に軽減
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">時間効率</h4>
                    <p className="text-gray-600">
                      効率的な学習で準備時間を50%短縮
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mr-15">
              <Card className="text-center p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-0">
                  <Users
                    className="w-8 h-8 mx-auto mb-3"
                    style={{ color: "#013220" }}
                  />
                  <div className="text-2xl font-bold text-black">100K+</div>
                  <div className="text-gray-600">利用者数</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-0">
                  <TrendingUp
                    className="w-8 h-8 mx-auto mb-3"
                    style={{ color: "#013220" }}
                  />
                  <div className="text-2xl font-bold text-black">85%</div>
                  <div className="text-gray-600">成功率</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-0">
                  <Shield
                    className="w-8 h-8 mx-auto mb-3"
                    style={{ color: "#013220" }}
                  />
                  <div className="text-2xl font-bold text-black">100%</div>
                  <div className="text-gray-600">安全性</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-0">
                  <Target
                    className="w-8 h-8 mx-auto mb-3"
                    style={{ color: "#013220" }}
                  />
                  <div className="text-2xl font-bold text-black">24/7</div>
                  <div className="text-gray-600">サポート</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section
        id="download-section"
        className="px-6 py-16 lg:px-12 lg:py-24 -mt-20"
        style={{ backgroundColor: "#F7F7EE" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ color: "#013220" }}
            >
              今すぐCueMeをダウンロード
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              無料でダウンロードして、AI面接対策を始めましょう。すべての主要プラットフォームに対応しています。
            </p>
          </div>

          <DownloadSection />
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        className="px-6 py-20 lg:px-12 lg:py-32"
        style={{ backgroundColor: "#013220" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-18">
            ストアを超えた。
            <br />
            <span className="text-green-300">グローバル成長の</span>
            <br />
            プラットフォーム。
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            より速く構築し、より多く収益化し、インスタントWebストアで収益エンジンを始動させましょう。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              className="bg-white text-black hover:bg-gray-100 rounded-full px-10 py-4 text-lg font-semibold flex items-center gap-2"
              onClick={() => {
                const downloadSection =
                  document.getElementById("download-section");
                downloadSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Download className="w-5 h-5" />
              今すぐ始める
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-10 py-4 text-lg font-semibold text-white border-white hover:bg-white hover:text-black"
            >
              詳細を見る
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-16 lg:px-12"
        style={{ backgroundColor: "#F7F7EE" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div
                className="flex items-center text-2xl font-bold mb-4"
                style={{ color: "#013220" }}
              >
                <img
                  src="/logo.png"
                  alt="CueMe Logo"
                  className="w-10 h-10 mr-2"
                  style={{ verticalAlign: "middle" }}
                />
                <span className="logo-text">CueMe</span>
              </div>
              <p className="text-gray-600">
                AI面接対策ツールで、あなたの転職を成功に導きます。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-4">製品</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link
                    href="/ai-interview"
                    className="hover:text-black transition-colors"
                  >
                    AI面接対策
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/subscription"
                    className="hover:text-black transition-colors"
                  >
                    料金プラン
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    企業向け
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-4">コンテンツ</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-black transition-colors"
                  >
                    面接対策ブログ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog/ai-interview-complete-guide"
                    className="hover:text-black transition-colors"
                  >
                    AI面接対策ガイド
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-black transition-colors">
                    面接質問集
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-4">会社情報</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/legal/tokusho" className="hover:text-black transition-colors">
                    特定商取引法に基づく表記
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="hover:text-black transition-colors">
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="hover:text-black transition-colors">
                    利用規約
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 mt-12 pt-8 text-center text-gray-600">
            <p>&copy; 2025 CueMe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
