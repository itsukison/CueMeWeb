"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FolderOpen,
  FileText,
  TrendingUp,
  Clock,
  Crown,
  Star,
  Gift,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  qna_count?: number;
}

interface SubscriptionPlan {
  name: string;
  price_jpy: number;
  max_files: number;
  max_qnas_per_file: number;
  max_monthly_questions: number;
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

export default function DashboardPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch collections and user data independently for better performance
    fetchCollections();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/subscriptions/user", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("qna_collections")
        .select(
          `
          *,
          qna_items(count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const collectionsWithCount =
        data?.map((collection) => ({
          ...collection,
          qna_count: collection.qna_items?.[0]?.count || 0,
        })) || [];

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "Free":
        return <Gift className="h-4 w-4" />;
      case "Basic":
        return <Star className="h-4 w-4" />;
      case "Premium":
        return <Crown className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getPlanName = (planName: string) => {
    switch (planName) {
      case "Free":
        return "無料プラン";
      case "Basic":
        return "ベーシックプラン";
      case "Premium":
        return "プレミアムプラン";
      default:
        return planName;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-700">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan and Usage Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Plan */}
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#f0f9f0" }}
              >
                {getPlanIcon(userData?.subscription.subscription_plans.name || "Free")}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-black">
                  {getPlanName(userData?.subscription.subscription_plans.name || "Free")}
                </div>
                <div className="text-xs text-gray-600">
                  {!userData ? "読み込み中..." : userData.subscription.subscription_plans.price_jpy === 0
                    ? "無料"
                    : `¥${userData.subscription.subscription_plans.price_jpy}/月`}
                </div>
              </div>
              <Link href="/dashboard/subscription">
                <Button variant="outline" size="sm" className="rounded-full px-2 py-1 text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  管理
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="font-semibold text-base text-black">
                  {userData?.subscription.subscription_plans.max_files || "5"}
                </div>
                <div className="text-gray-600 text-xs">ファイル</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-base text-black">
                  {userData?.subscription.subscription_plans.max_qnas_per_file || "10"}
                </div>
                <div className="text-gray-600 text-xs">Q&A/ファイル</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-base text-black">
                  {userData?.subscription.subscription_plans.max_monthly_questions || "50"}
                </div>
                <div className="text-gray-600 text-xs">月間質問</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Status */}
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#f0f9f0" }}
              >
                <TrendingUp className="h-4 w-4" style={{ color: "#013220" }} />
              </div>
              <span className="font-semibold text-sm text-black">
                使用状況
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">ファイル</span>
                  <span className="text-xs font-semibold text-black">
                    {userData?.current_usage.files || collections.length} /{" "}
                    {userData?.subscription.subscription_plans.max_files || "5"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: "#013220",
                      width: `${Math.min(
                        ((userData?.current_usage.files || collections.length) /
                          (userData?.subscription.subscription_plans.max_files || 5)) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">今月の質問</span>
                  <span className="text-xs font-semibold text-black">
                    {userData?.usage.questions_used || "0"} /{" "}
                    {userData?.subscription.subscription_plans.max_monthly_questions || "50"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: "#013220",
                      width: `${Math.min(
                        ((userData?.usage.questions_used || 0) /
                          (userData?.subscription.subscription_plans.max_monthly_questions || 50)) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black">
            質問回答コレクション
          </h2>
          <p className="text-gray-600 text-sm">
            面接の質問と回答のコレクションを管理
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium">
            <Plus className="h-4 w-4" />
            新規登録
          </Button>
        </Link>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <Card className="text-center py-12 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-2xl">
          <CardContent>
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "#f0f9f0" }}
            >
              <FolderOpen className="h-6 w-6" style={{ color: "#013220" }} />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              コレクションがありません
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              最初の質問回答コレクションを作成しましょう
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard/collections/new">
                <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium">
                  <Plus className="h-4 w-4" />
                  手動で作成
                </Button>
              </Link>
              <Link href="/dashboard/documents">
                <Button variant="outline" className="rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium border-gray-300">
                  <FileText className="h-4 w-4" />
                  文書から作成
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="bg-white/70 backdrop-blur-md border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl group"
            >
              <Link href={`/dashboard/collections/${collection.id}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#f0f9f0" }}
                    >
                      <FolderOpen
                        className="h-4 w-4"
                        style={{ color: "#013220" }}
                      />
                    </div>
                    <span className="text-black font-semibold truncate">
                      {collection.name}
                    </span>
                  </CardTitle>
                  {collection.description && (
                    <CardDescription className="text-gray-600 text-sm line-clamp-2">
                      {collection.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div
                      className="flex items-center gap-1"
                      style={{ color: "#013220" }}
                    >
                      <FileText className="h-3 w-3" />
                      <span className="font-medium">
                        {collection.qna_count} 項目
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(collection.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
