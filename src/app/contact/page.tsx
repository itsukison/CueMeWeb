"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronDown,
  Globe,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/send-contact-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        throw new Error(result.error || "送信に失敗しました");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "送信に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Link
                  href="/ai-interview"
                  className="text-black hover:text-gray-700 font-medium"
                >
                  AI面接対策
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/blog"
                  className="text-black hover:text-gray-700 font-medium"
                >
                  面接対策ブログ
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a
                  href="#pricing"
                  className="text-black hover:text-gray-700 font-medium"
                >
                  料金
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <a
                  href="#support"
                  className="text-black hover:text-gray-700 font-medium"
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

          {/* Back to Home */}
          <Link
            href="/"
            className="text-black hover:text-gray-700 font-medium hidden sm:inline flex items-center gap-2"
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
      <section
        className="relative pt-20 pb-20 overflow-hidden"
        style={{ backgroundColor: "#013220" }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-white/20 text-white/80 text-sm font-medium backdrop-blur-sm mb-6">
              <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
              お問い合わせ
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              お気軽に
              <br />
              <span className="text-green-300">ご連絡</span>ください
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              CueMeに関するご質問、ご要望、技術的なサポートが必要でしたら、
              <br />
              お気軽にお問い合わせください。専門チームが迅速にお答えします。
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20" style={{ backgroundColor: "#F7F7EE" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Contact Information */}
            <div>
              <h2
                className="text-3xl font-bold mb-6"
                style={{ color: "#013220" }}
              >
                サポート情報
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                CueMeチームは皆様のご質問にお答えし、最高の面接練習体験を提供することをお約束します。
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(1, 50, 32, 0.1)" }}
                  >
                    <Mail className="w-6 h-6" style={{ color: "#013220" }} />
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: "#013220" }}
                    >
                      メールサポート
                    </h3>
                    <p className="text-gray-600">
                      ployee.officialcontact@gmail.com
                    </p>
                    <p className="text-sm text-gray-500">
                      24時間以内に返信いたします
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(1, 50, 32, 0.1)" }}
                  >
                    <Clock className="w-6 h-6" style={{ color: "#013220" }} />
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: "#013220" }}
                    >
                      対応時間
                    </h3>
                    <p className="text-gray-600">月〜金: 9:00 - 18:00</p>
                    <p className="text-sm text-gray-500">日本標準時（JST）</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(1, 50, 32, 0.1)" }}
                  >
                    <CheckCircle
                      className="w-6 h-6"
                      style={{ color: "#013220" }}
                    />
                  </div>
                  <div>
                    <h3
                      className="font-semibold mb-1"
                      style={{ color: "#013220" }}
                    >
                      サポート品質
                    </h3>
                    <p className="text-gray-600">専門チームによる丁寧な対応</p>
                    <p className="text-sm text-gray-500">
                      技術的な質問から使い方まで
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <h3
                className="text-2xl font-bold mb-6"
                style={{ color: "#013220" }}
              >
                お問い合わせフォーム
              </h3>

              {/* Success Message */}
              {submitStatus === "success" && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-medium">
                      お問い合わせを送信しました！
                    </p>
                    <p className="text-green-600 text-sm">
                      確認メールをお送りしましたのでご確認ください。
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submitStatus === "error" && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">送信エラー</p>
                    <p className="text-red-600 text-sm">
                      {errorMessage || "送信に失敗しました。再度お試しください。"}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-semibold"
                      style={{ color: "#013220" }}
                    >
                      お名前 *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="山田太郎"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="rounded-xl border-gray-200 focus:border-gray-400 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold"
                      style={{ color: "#013220" }}
                    >
                      メールアドレス *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="rounded-xl border-gray-200 focus:border-gray-400 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="text-sm font-semibold"
                    style={{ color: "#013220" }}
                  >
                    件名 *
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="お問い合わせの件名を入力してください"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="rounded-xl border-gray-200 focus:border-gray-400 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="message"
                    className="text-sm font-semibold"
                    style={{ color: "#013220" }}
                  >
                    メッセージ *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="お問い合わせ内容を詳しくお聞かせください..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="rounded-xl border-gray-200 focus:border-gray-400 bg-white resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl py-3 text-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: isSubmitting ? "#666" : "#013220",
                    color: "white",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      送信する
                    </>
                  )}
                </Button>
              </form>

              <p className="text-sm text-gray-500 mt-4 text-center">
                * は必須項目です。お客様の個人情報は適切に保護されます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12"
        style={{ backgroundColor: "#013220", color: "white" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/logo.png"
                alt="CueMe Logo"
                className="w-8 h-8 mr-2"
              />
              <span className="logo-text text-xl font-bold">CueMe</span>
            </div>
            <p className="text-white/80 mb-4">
              AI面接対策の決定版 - あなたの面接成功をサポートします
            </p>
            <div className="flex justify-center space-x-6 text-sm text-white/60">
              <Link href="/legal/privacy" className="hover:text-white">
                プライバシーポリシー
              </Link>
              <Link href="/legal/terms" className="hover:text-white">
                利用規約
              </Link>
              <span>© 2025 CueMe. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}