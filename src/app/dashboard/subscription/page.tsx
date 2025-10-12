"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Crown,
  Star,
  Gift,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionPlan {
  id: string;
  name: string;
  price_jpy: number;
  max_files: number;
  max_qnas_per_file: number;
  max_monthly_questions: number;
  stripe_price_id: string | null;
}

interface UserSubscription {
  subscription_plans: SubscriptionPlan;
  status: string;
}

interface UserData {
  subscription: UserSubscription;
  usage: {
    questions_used: number;
    current_month: string;
  };
  current_usage: {
    files: number;
  };
}

export default function SubscriptionPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [pendingDowngrade, setPendingDowngrade] = useState<any>(null);

  useEffect(() => {
    Promise.all([fetchUserData(), fetchAllPlans(), fetchPendingDowngrade()]);
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(
          "サブスクリプション詳細を表示するにはサインインしてください"
        );
      }

      const response = await fetch("/api/subscriptions/user", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("サブスクリプションデータの取得に失敗しました");
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "サブスクリプションデータの読み込みに失敗しました"
      );
    }
  };

  const fetchAllPlans = async () => {
    try {
      const response = await fetch("/api/subscriptions/plans");
      if (!response.ok) {
        throw new Error("プランの取得に失敗しました");
      }

      const data = await response.json();
      setAllPlans(data.plans || []);
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDowngrade = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/subscriptions/pending-downgrade", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingDowngrade(data.pendingDowngrade);
      }
    } catch (err) {
      console.error("Error fetching pending downgrade:", err);
    }
  };

  const handleCancelDowngrade = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("サインインしてください");
      }

      const response = await fetch("/api/subscriptions/cancel-scheduled-downgrade", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("ダウングレードのキャンセルに失敗しました");
      }

      setPendingDowngrade(null);
      await fetchUserData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ダウングレードのキャンセルに失敗しました"
      );
    }
  };

  const handleUpgrade = async (planName: string) => {
    setUpgradeLoading(planName);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("アップグレードするにはサインインしてください");
      }

      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planName,
        }),
      });

      if (!response.ok) {
        throw new Error("チェックアウトセッションの作成に失敗しました");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "アップグレード処理の開始に失敗しました"
      );
    } finally {
      setUpgradeLoading(null);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("サインインしてください");
      }

      const response = await fetch("/api/subscriptions/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("請求ポータルへのアクセスに失敗しました");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "請求ポータルへのアクセスに失敗しました"
      );
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "Free":
        return <Gift className="h-6 w-6" />;
      case "Basic":
        return <Star className="h-6 w-6" />;
      case "Premium":
        return <Crown className="h-6 w-6" />;
      default:
        return <Gift className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case "Free":
        return "bg-gray-100 text-gray-800";
      case "Basic":
        return "bg-blue-100 text-blue-800";
      case "Premium":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-700">
          サブスクリプション詳細を読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 -mt-12" style={{ backgroundColor: "#F7F7EE" }}>
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-full px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ダッシュボードに戻る
          </Button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
        {/* Header */}
        <div className="text-center mb-15">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#013220" }}>
            プラン管理
          </h1>
          <p className="text-gray-600 mb-4">
            あなたのニーズに合ったプランを選択してください
          </p>
          {userData?.subscription.subscription_plans.stripe_price_id && (
            <Button
              onClick={handleBillingPortal}
              variant="outline"
              className="rounded-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              請求管理
            </Button>
          )}
        </div>

        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Pending Downgrade Notice */}
        {pendingDowngrade && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-orange-50 border-orange-200 rounded-2xl">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900 mb-2">
                      ダウングレード予定
                    </h3>
                    <p className="text-sm text-orange-700 mb-3">
                      {new Date(pendingDowngrade.scheduled_date).toLocaleDateString('ja-JP')} に{' '}
                      <strong>{pendingDowngrade.target_plan?.name}プラン</strong> へダウングレードされます。
                      それまでは現在のプランの機能をご利用いただけます。
                    </p>
                    <Button
                      onClick={handleCancelDowngrade}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      ダウングレードをキャンセル
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Available Plans */}
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 md:grid-cols-3">
            {allPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl ${
                  userData?.subscription.subscription_plans.name === plan.name
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle>
                    {plan.name === "Free"
                      ? "フリープラン"
                      : plan.name === "Basic"
                      ? "ベーシックプラン"
                      : plan.name === "Premium"
                      ? "プレミアムプラン"
                      : plan.name}
                  </CardTitle>
                  <div className="text-2xl font-bold">
                    {plan.price_jpy === 0 ? "無料" : `¥${plan.price_jpy}/月`}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>{plan.max_files} ファイル</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>ファイルあたり{plan.max_qnas_per_file} Q&A</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>月間{plan.max_monthly_questions}質問</span>
                    </div>
                  </div>

                  {userData?.subscription.subscription_plans.name ===
                  plan.name ? (
                    <Badge className="w-full justify-center py-2">
                      現在のプラン
                    </Badge>
                  ) : plan.price_jpy === 0 ? (
                    (userData?.subscription.subscription_plans.price_jpy ?? 0) >
                    0 ? (
                      <Link
                        href={`/dashboard/subscription/downgrade?plan=${plan.name}`}
                      >
                        <Button
                          variant="outline"
                          className="w-full rounded-full"
                        >
                          無料プランにダウングレード
                        </Button>
                      </Link>
                    ) : (
                      <div className="text-center text-sm text-gray-500">
                        常に無料
                      </div>
                    )
                  ) : (userData?.subscription.subscription_plans.price_jpy ??
                      0) > plan.price_jpy ? (
                    <Link
                      href={`/dashboard/subscription/downgrade?plan=${plan.name}`}
                    >
                      <Button variant="outline" className="w-full rounded-full">
                        ダウングレード
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={upgradeLoading === plan.name}
                      className="w-full rounded-full"
                    >
                      {upgradeLoading === plan.name
                        ? "処理中..."
                        : "アップグレード"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
