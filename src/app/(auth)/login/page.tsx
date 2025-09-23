"use client";

import { useState, useEffect } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, Lock, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for redirect parameter for deep linking
  const redirectTo = searchParams?.get('redirect_to') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(
        error.message === "Invalid login credentials"
          ? "メールアドレスまたはパスワードが正しくありません"
          : error.message
      );
    } else {
      // Handle deep link callback for electron app
      if (redirectTo.startsWith('cueme://')) {
        handleDeepLinkRedirect(redirectTo);
      } else {
        router.push(redirectTo);
      }
    }
    setLoading(false);
  };

  const handleDeepLinkRedirect = async (deepLinkUrl: string) => {
    try {
      // Get the current session to include tokens in the deep link
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token && session?.refresh_token) {
        // Construct the deep link with authentication tokens as URL parameters
        const callbackUrl = `${deepLinkUrl}?access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer`;
        
        // Show success message and redirect
        setMessage('認証が完了しました。アプリに戻っています...');
        
        // Redirect to the deep link after a short delay
        setTimeout(() => {
          window.location.href = callbackUrl;
        }, 2000);
      } else {
        throw new Error('認証トークンを取得できませんでした');
      }
    } catch (error) {
      console.error('Deep link redirect error:', error);
      setMessage('アプリへの戻りに失敗しました。手動でアプリを開いてください。');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const redirectUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.startsWith('cueme://') ? `${redirectUrl}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}` : `${redirectUrl}${redirectTo}`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
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
              <LogIn className="w-8 h-8" style={{ color: "#013220" }} />
            </div>
            <CardTitle className="text-2xl font-bold text-black">
              ログイン
            </CardTitle>
            <CardDescription className="text-gray-600">
              質問回答コレクションにアクセスして面接対策を始めましょう
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
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
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    required
                    className="pl-10 rounded-xl border-gray-200 focus:border-gray-400 bg-white/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-900 rounded-full py-3 font-semibold"
                disabled={loading}
              >
                {loading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-500 font-medium">
                  または
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-full py-3 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Googleでログイン
            </Button>

            {message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="text-sm text-red-600 text-center">
                  {message}
                </div>
              </div>
            )}

            <div className="text-center text-sm text-gray-600">
              アカウントをお持ちでない方は{" "}
              <Link
                href="/signup"
                className="font-semibold hover:underline"
                style={{ color: "#013220" }}
              >
                新規登録
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
