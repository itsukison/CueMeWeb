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
    <div className="min-h-screen bg-app-bg">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 relative z-10">
        {/* Logo */}
        <Link
          href="/"
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
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="space-x-8">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/ai-interview"
                  className="text-text-primary hover:opacity-70 font-medium transition-opacity"
                >
                  AI面接対策
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/blog"
                  className="text-text-primary hover:opacity-70 font-medium transition-opacity"
                >
                  面接対策ブログ
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/subscription"
                  className="text-text-primary hover:opacity-70 font-medium transition-opacity"
                >
                  料金
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a
                  href="#support"
                  className="text-text-primary hover:opacity-70 font-medium transition-opacity"
                >
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
            <DropdownMenuTrigger className="flex items-center space-x-1 text-text-primary hover:opacity-70 transition-opacity">
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
            className="text-text-primary hover:opacity-70 font-medium hidden sm:inline transition-opacity"
          >
            お問い合わせ
          </Link>

          {/* Login Link */}
          <Link
            href="/login"
            className="text-text-primary hover:opacity-70 font-medium hidden sm:inline transition-opacity"
          >
            ログイン
          </Link>

          {/* CTA Button */}
          <Link href="/login">
            <Button className="bg-accent-lime text-text-primary hover:bg-accent-light rounded-full px-6 transition-colors">
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
              className="rounded-full border-2 border-text-primary text-text-primary hover:bg-text-primary hover:text-white px-6 py-2 transition-colors"
            >
              面接成功率85%を実現 →
            </Button>
          </div>

          {/* Main Headline - SEO Optimized */}
          <div className="mb-6">
            <h1 className="text-5xl mt-12 md:text-6xl lg:text-8xl font-black text-text-primary mb-3 leading-[0.9] tracking-tight">
              見えない会話アシスト
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-[0.9] tracking-tight text-text-primary">
              CueMe
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-text-primary opacity-70 mb-8 max-w-4xl mx-auto leading-relaxed">
            面接も、商談も、日常の会話も。あなたを密かに支える、次世代のリアルタイムAI
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              className="bg-text-primary text-white hover:opacity-90 rounded-full px-8 py-3 text-lg flex items-center gap-2 transition-opacity"
              onClick={() => {
                const downloadSection =
                  document.getElementById("download-section");
                downloadSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Download className="w-5 h-5" />
              無料ダウンロード
            </Button>
            <Link href="/tutorial">
              <Button
                variant="outline"
                className="rounded-full px-8 py-3 text-lg flex items-center gap-2 border-text-primary text-text-primary hover:bg-text-primary hover:text-white transition-colors"
              >
                <Play className="w-5 h-5" />
                デモを見る
              </Button>
            </Link>
          </div>

          {/* Down Arrow */}
          <div className="flex justify-center">
            <ArrowDown className="w-6 h-6 text-text-primary opacity-60 animate-bounce" />
          </div>
        </div>

        {/* Background Lime Shape */}
        <div className="absolute -bottom-20 left-0 right-0 h-40 md:h-56 lg:h-72 rounded-t-[50px] md:rounded-t-[100px] bg-accent-lime" />
      </section>

      {/* Merged Secret Bar & Voice Input Section */}
      <section className="py-20 lg:py-24 -mt-20 bg-accent-lime relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <div className="text-center -mt-25 md:-mt-40 lg:-mt-25">
            <div className="flex items-center justify-center gap-3 mb-6">
              <EyeOff className="w-8 h-8 text-text-primary" />
              <Mic className="w-8 h-8 text-text-primary" />
              <span className="text-lg font-semibold text-text-primary">
                完全隠密 × 音声対応
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6 leading-tight">
              あなただけの
              <br />
              秘密のAIアシスタント
            </h2>
            <p className="text-lg md:text-xl text-text-primary opacity-80 mb-12 max-w-5xl mx-auto leading-relaxed">
              画面共有では見えない秘密のツールバーで、話すだけで完璧な面接準備。
              <br />
              AIが会話から質問を検出し、リアルタイムで最適な回答をサポートします。
            </p>
          </div>

          {/* Centered Large Interactive Image */}
          <div className="flex justify-center mb-16">
            <div className="w-full max-w-5xl">
              <div className="border border-card-dark rounded-container p-2 bg-card-light">
                <div
                  className="relative w-full h-[350px] md:h-[450px] lg:h-[550px] cursor-col-resize select-none rounded-card overflow-hidden"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                >
                  {/* Background image (invisible - pure MacBook) */}
                  <div className="absolute inset-0">
                    <img
                      src="/inivisible.png"
                      alt="MacBook without CueMe"
                      className="w-full h-full object-cover rounded-card"
                    />
                    {/* Label for invisible.png */}
                    <div className="absolute top-2 left-2 bg-text-primary/80 text-white text-xs px-2 py-1 rounded">
                      共有時の画面
                    </div>
                  </div>

                  {/* Foreground image (visible - CueMe bar over MacBook) */}
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: `inset(0 0 0 ${dragPosition}%)`,
                    }}
                  >
                    <img
                      src="/visible.png"
                      alt="MacBook with CueMe bar"
                      className="w-full h-full object-cover rounded-card"
                    />
                  </div>

                  {/* Divider bar */}
                  <div
                    className="absolute top-0 h-full w-1 bg-text-primary cursor-col-resize hover:opacity-80 transition-opacity z-10 shadow-lg"
                    style={{
                      left: `${dragPosition}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-text-primary rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-1 h-4 bg-white rounded-full mr-0.5"></div>
                      <div className="w-1 h-4 bg-white rounded-full ml-0.5"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="inline-block px-4 py-2 rounded-lg">
                    <p className="text-sm lg:text-base -mt-3 text-text-primary">
                      バーをドラッグして比較 -
                      あなたの画面にだけCueMeが表示されます
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Below Image */}
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              {/* Process Steps - Reorganized */}
              <h3 className="text-2xl lg:text-3xl font-bold text-text-primary mb-8 text-center">
                3ステップで完璧準備
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-text-primary">
                      1
                    </span>
                  </div>
                  <h4 className="font-bold text-text-primary mb-2 text-lg">
                    自動質問検出
                  </h4>
                  <p className="text-text-primary text-sm opacity-70">
                    会話から面接質問を自動で識別・抽出
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-text-primary">
                      2
                    </span>
                  </div>
                  <h4 className="font-bold text-text-primary mb-2 text-lg">
                    パーソナライズ回答
                  </h4>
                  <p className="text-text-primary text-sm opacity-70">
                    あなたの経歴に基づいた最適な回答を生成
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-text-primary">
                      3
                    </span>
                  </div>
                  <h4 className="font-bold text-text-primary mb-2 text-lg">
                    隠密表示
                  </h4>
                  <p className="text-text-primary text-sm opacity-70">
                    秘密のツールバーで面接官に気づかれずサポート
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Q&A Preparation Section */}
      <section className="px-6 py-20 mb-10 lg:px-12 lg:py-32 bg-app-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-text-primary" />
              <span className="text-lg font-semibold text-text-primary">
                カスタム準備
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
              あなたの経歴で
              <br />
              完全カスタマイズ
            </h2>
            <p className="text-xl max-w-4xl mx-auto text-text-primary opacity-80">
              履歴書、職務経歴書、志望動機などをアップロードして、あなた専用のAI面接対策を構築。
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-container bg-card-dark p-4 shadow-lg max-w-md mx-auto">
              <img
                src="/mode.png"
                alt="CueMe Document Management"
                className="w-full h-auto rounded-container"
              />
            </div>

            <div className="rounded-container bg-card-dark p-4 shadow-lg ">
              <img
                src="/qnaedit.png"
                alt="CueMe Q&A Editing"
                className="w-full h-auto rounded-container"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-card-dark rounded-2xl p-6 hover:shadow-xl transition-all">
              <div className="bg-card-light rounded-xl p-6">
                <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-text-primary" />
                </div>
                <h3 className="text-lg text-text-primary font-bold mb-3">
                  ドキュメント登録
                </h3>
                <p className="text-sm text-text-primary opacity-70 leading-relaxed">
                  履歴書や職務経歴書をアップロードして、AIがあなたの経歴を学習
                </p>
              </div>
            </div>

            <div className="bg-card-dark rounded-2xl p-6 hover:shadow-xl transition-all">
              <div className="bg-card-light rounded-xl p-6">
                <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-text-primary" />
                </div>
                <h3 className="text-lg text-text-primary font-bold mb-3">
                  Q&A自動生成
                </h3>
                <p className="text-sm text-text-primary opacity-70 leading-relaxed">
                  あなたの経歴に基づいて、予想される質問と最適な回答を自動生成
                </p>
              </div>
            </div>

            <div className="bg-card-dark rounded-2xl p-6 hover:shadow-xl transition-all">
              <div className="bg-card-light rounded-xl p-6">
                <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-text-primary" />
                </div>
                <h3 className="text-lg text-text-primary font-bold mb-3">
                  カスタム編集
                </h3>
                <p className="text-sm text-text-primary opacity-70 leading-relaxed">
                  生成された回答を自由に編集して、あなたらしい表現に調整
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Interface Section */}
      <section className="px-6 py-20 lg:px-12 lg:py-32 bg-app-bg">
        <div className="max-w-7xl mx-auto bg-card-dark rounded-container p-8 md:p-12 lg:p-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="rounded-container border border-subtle-bg shadow-lg">
                <img
                  src="/working.png"
                  alt="CueMe Chat Interface"
                  className="w-full h-auto rounded-container"
                />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="w-8 h-8 text-text-primary" />
                  <span className="text-lg font-semibold text-text-primary">
                    リアルタイム対話
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
                  面接中も
                  <br />
                  AIが即座に回答
                </h2>
                <p className="text-xl text-text-primary opacity-80 mb-8 leading-relaxed">
                  面接官の質問をリアルタイムで分析し、あなたの準備した回答や新しい質問に対する最適な答えを瞬時に提供します。
                </p>

                <div className="grid grid-cols-1 gap-6">
                  <Card className="bg-card-light border border-subtle-bg rounded-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center">
                          <Brain className="w-6 h-6 text-text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary mb-1">
                            質問の自動認識
                          </h4>
                          <p className="text-text-primary opacity-70 text-sm">
                            面接官の質問を音声・テキストで瞬時に認識
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card-light border border-subtle-bg rounded-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center">
                          <Target className="w-6 h-6 text-text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary mb-1">
                            最適回答の生成
                          </h4>
                          <p className="text-text-primary opacity-70 text-sm">
                            あなたの経歴に基づいた自然で説得力のある回答を生成
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - The Funky Part You Liked */}
      <section className="px-6 py-20 lg:px-12 lg:py-32 bg-app-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-text-primary mb-8 leading-tight">
              CueMeが
              <br />
              選ばれる理由
            </h2>
            <p className="text-xl md:text-2xl text-text-primary opacity-70 max-w-4xl mx-auto">
              グローバルマーケットプレイスで、あなたのオーディエンスリーチを加速。
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            <Card className="bg-card-light border border-card-dark shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-container">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center mr-4">
                    <MessageSquare className="w-6 h-6 text-text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">Tさん</h4>
                    <p className="text-text-primary opacity-70 text-sm">
                      マーケティング職
                    </p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-accent-lime text-accent-lime"
                    />
                  ))}
                </div>
                <p className="text-text-primary opacity-80 leading-relaxed">
                  「CueMeのおかげで、第一志望の企業に内定をもらえました。AIが生成する質問の精度が驚くほど高く、実際の面接でも同じような質問が出ました。」
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card-light border border-card-dark shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-container">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center mr-4">
                    <Brain className="w-6 h-6 text-text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">Sさん</h4>
                    <p className="text-text-primary opacity-70 text-sm">
                      エンジニア職
                    </p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-accent-lime text-accent-lime"
                    />
                  ))}
                </div>
                <p className="text-text-primary opacity-80 leading-relaxed">
                  「技術面接の対策が特に素晴らしい。コーディング問題から設計問題まで、幅広くカバーしてくれるので、自信を持って面接に臨めました。」
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card-light border border-card-dark shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-container">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">Yさん</h4>
                    <p className="text-text-primary opacity-70 text-sm">
                      営業職
                    </p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-accent-lime text-accent-lime"
                    />
                  ))}
                </div>
                <p className="text-text-primary opacity-80 leading-relaxed">
                  「面接が苦手でしたが、CueMeで練習を重ねることで、自然に話せるようになりました。リアルタイム支援機能が特に心強かったです。」
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mt-40 mb-10 items-center max-w-5xl mx-auto">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
                面接成功への確実なステップ
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 mt-1 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-text-primary fill-accent-lime" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      面接通過率向上
                    </h4>
                    <p className="text-text-primary opacity-70">
                      平均して面接通過率が40%向上
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 mt-1 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-text-primary fill-accent-lime" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      不安の軽減
                    </h4>
                    <p className="text-text-primary opacity-70">
                      十分な準備により面接への不安を大幅に軽減
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 mt-1 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-text-primary fill-accent-lime" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      時間効率
                    </h4>
                    <p className="text-text-primary opacity-70">
                      効率的な学習で準備時間を50%短縮
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center p-6 bg-card-light border border-card-dark hover:shadow-lg transition-shadow rounded-card">
                <CardContent className="p-0">
                  <Users className="w-8 h-8 mx-auto mb-3 text-text-primary" />
                  <div className="text-2xl font-bold text-text-primary">
                    100K+
                  </div>
                  <div className="text-text-primary opacity-70">利用者数</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6 bg-card-light border border-card-dark hover:shadow-lg transition-shadow rounded-card">
                <CardContent className="p-0">
                  <TrendingUp className="w-8 h-8 mx-auto mb-3 text-text-primary" />
                  <div className="text-2xl font-bold text-text-primary">
                    85%
                  </div>
                  <div className="text-text-primary opacity-70">成功率</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6 bg-card-light border border-card-dark hover:shadow-lg transition-shadow rounded-card">
                <CardContent className="p-0">
                  <Shield className="w-8 h-8 mx-auto mb-3 text-text-primary" />
                  <div className="text-2xl font-bold text-text-primary">
                    100%
                  </div>
                  <div className="text-text-primary opacity-70">安全性</div>
                </CardContent>
              </Card>
              <Card className="text-center p-6 bg-card-light border border-card-dark hover:shadow-lg transition-shadow rounded-card">
                <CardContent className="p-0">
                  <Target className="w-8 h-8 mx-auto mb-3 text-text-primary" />
                  <div className="text-2xl font-bold text-text-primary">
                    24/7
                  </div>
                  <div className="text-text-primary opacity-70">サポート</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section
        id="download-section"
        className="px-6 py-8 lg:px-12 lg:py-24 -mt-20 bg-app-bg"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
              今すぐCueMeをダウンロード
            </h2>
            <p className="text-xl text-text-primary opacity-80 max-w-3xl mx-auto">
              無料でダウンロードして、AI面接対策を始めましょう。すべての主要プラットフォームに対応しています。
            </p>
          </div>

          <DownloadSection />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-20 lg:px-12 lg:py-32 bg-app-bg">
        <div className="max-w-6xl mx-auto bg-text-primary rounded-container p-8 md:p-12 lg:p-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              ストアを超えた。
              <br />
              <span className="text-accent-lime">グローバル成長の</span>
              <br />
              プラットフォーム。
            </h2>
            <p className="text-xl text-white opacity-80 mb-12 max-w-3xl mx-auto">
              より速く構築し、より多く収益化し、インスタントWebストアで収益エンジンを始動させましょう。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                className="bg-white text-text-primary hover:opacity-90 rounded-full px-10 py-4 text-lg font-semibold flex items-center gap-2 transition-opacity"
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
                className="rounded-full px-10 py-4 text-lg font-semibold text-white border-white hover:bg-white hover:text-text-primary transition-colors"
              >
                詳細を見る
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 lg:px-12 bg-footer-bg">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center text-2xl font-bold text-text-primary mb-4">
                <img
                  src="/logo.png"
                  alt="CueMe Logo"
                  className="w-10 h-10 mr-2"
                  style={{ verticalAlign: "middle" }}
                />
                <span className="logo-text">CueMe</span>
              </div>
              <p className="text-text-primary opacity-70">
                AI面接対策ツールで、あなたの転職を成功に導きます。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary mb-4">製品</h3>
              <ul className="space-y-2 text-text-primary opacity-70">
                <li>
                  <Link
                    href="/ai-interview"
                    className="hover:opacity-100 transition-opacity"
                  >
                    AI面接対策
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/subscription"
                    className="hover:opacity-100 transition-opacity"
                  >
                    料金プラン
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    企業向け
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary mb-4">
                コンテンツ
              </h3>
              <ul className="space-y-2 text-text-primary opacity-70">
                <li>
                  <Link
                    href="/blog"
                    className="hover:opacity-100 transition-opacity"
                  >
                    面接対策ブログ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog/ai-interview-complete-guide"
                    className="hover:opacity-100 transition-opacity"
                  >
                    AI面接対策ガイド
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:opacity-100 transition-opacity">
                    面接質問集
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary mb-4">会社情報</h3>
              <ul className="space-y-2 text-text-primary opacity-70">
                <li>
                  <Link
                    href="/legal/tokusho"
                    className="hover:opacity-100 transition-opacity"
                  >
                    特定商取引法に基づく表記
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/privacy"
                    className="hover:opacity-100 transition-opacity"
                  >
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/terms"
                    className="hover:opacity-100 transition-opacity"
                  >
                    利用規約
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-card-dark mt-12 pt-8 text-center text-text-primary opacity-70">
            <p>&copy; 2025 CueMe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
