"use client";

import { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, Lock, UserPlus } from "lucide-react";

function SignUpContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  
  // Check for redirect parameter for deep linking
  const redirectTo = searchParams?.get('redirect_to') || '/dashboard';

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const redirectUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo.startsWith('cueme://') ? `${redirectUrl}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}` : `${redirectUrl}${redirectTo}`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("確認メールを送信しました！メールをご確認ください。");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F7F7EE" }}
    >
      {/* Header with Logo */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-black hover:text-gray-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">ホームに戻る</span>
        </Link>

        {/* Logo */}
        <div
          className="flex items-center text-xl font-bold"
          style={{ color: "#013220" }}
        >
          <img
            src="/logo.png"
            alt="CueMe Logo"
            className="w-8 h-8 mr-2"
            style={{ verticalAlign: "middle" }}
          />
          <span className="logo-text">CueMe</span>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}

        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-xl rounded-2xl">
          <CardHeader className="text-center pb-4">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "#f0f9f0" }}
            >
              <UserPlus className="w-8 h-8" style={{ color: "#013220" }} />
            </div>
            <CardTitle className="text-2xl font-bold text-black">
              新規登録
            </CardTitle>
            <CardDescription className="text-gray-600">
              CueMeに参加して面接対策の質問回答コレクションを管理しましょう
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-black"
                >
                  メールアドレス
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    required
                    className="pl-10 rounded-xl border-gray-200 focus:border-gray-400 bg-white/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-black"
                >
                  パスワード
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="パスワードを作成（6文字以上）"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    required
                    minLength={6}
                    className="pl-10 rounded-xl border-gray-200 focus:border-gray-400 bg-white/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-900 rounded-full py-3 font-semibold"
                disabled={loading}
              >
                {loading ? "アカウント作成中..." : "アカウント作成"}
              </Button>
            </form>

            {message && (
              <div
                className={`p-3 border rounded-xl ${
                  message.includes("確認メール")
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div
                  className={`text-sm text-center ${
                    message.includes("確認メール")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message}
                </div>
              </div>
            )}

            <div className="text-center text-sm text-gray-600">
              すでにアカウントをお持ちの方は{" "}
              <Link
                href="/login"
                className="font-semibold hover:underline"
                style={{ color: "#013220" }}
              >
                ログイン
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: "#F7F7EE" }} />}> 
      <SignUpContent />
    </Suspense>
  );
}
