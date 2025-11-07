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
  Trash2,
  Loader2,
  HelpCircle,
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
  max_qna_files: number;
  max_scanned_documents: number;
  max_qnas_per_file: number;
  max_monthly_questions: number;
  max_total_qna_pairs: number;
  max_total_document_scans: number;
}

interface UserSubscription {
  subscription_plans: SubscriptionPlan;
  status: string;
}

interface UserData {
  subscription: UserSubscription;
  usage: {
    questions_used: number;
    qna_files_used: number;
    scanned_documents_used: number;
    current_month: string;
  };
  current_usage: {
    qna_files: number;
    documents: number;
    totalQnaPairs: number;
    totalDocumentScans: number;
  };
}

export default function DashboardPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Fetch collections and user data
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

  const handleDelete = async (collection: Collection) => {
    if (!confirm(`「${collection.name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setDeleting(collection.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Delete collection using API
      const response = await fetch('/api/collections', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ collectionId: collection.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete collection');
      }

      // Update local state
      setCollections(prev => prev.filter(c => c.id !== collection.id));

      // Refresh user data to update usage counts
      fetchUserData();
    } catch (err) {
      console.error('Error deleting collection:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete collection');
    } finally {
      setDeleting(null);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {/* Current Plan */}
        <Card className="bg-card-light backdrop-blur-md border-0 shadow-lg rounded-container">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-light">
                {getPlanIcon(userData?.subscription.subscription_plans.name || "Free")}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-text-primary">
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
                <div className="font-semibold text-base text-text-primary">
                  {userData?.subscription.subscription_plans.max_total_qna_pairs || "10"}
                </div>
                <div className="text-gray-600 text-xs">Q&Aペア</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-base text-text-primary">
                  {userData?.subscription.subscription_plans.max_total_document_scans || "3"}
                </div>
                <div className="text-gray-600 text-xs">文書スキャン</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-base text-text-primary">
                  {userData?.subscription.subscription_plans.max_monthly_questions || "10"}
                </div>
                <div className="text-gray-600 text-xs">月間質問</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Status */}
        <Card className="bg-card-light backdrop-blur-md border-0 shadow-lg rounded-container">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-light">
                <TrendingUp className="h-4 w-4 text-text-primary" />
              </div>
              <span className="font-semibold text-sm text-text-primary">
                使用状況
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">Q&Aペア</span>
                  <span className="text-xs font-semibold text-text-primary">
                    {userData?.current_usage.totalQnaPairs || 0} /{" "}
                    {userData?.subscription.subscription_plans.max_total_qna_pairs || "10"}
                  </span>
                </div>
                <div className="w-full bg-card-dark rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300 bg-accent-lime"
                    style={{
                      width: `${Math.min(
                        ((userData?.current_usage.totalQnaPairs || 0) /
                          (userData?.subscription.subscription_plans.max_total_qna_pairs || 10)) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">文書スキャン</span>
                  <span className="text-xs font-semibold text-text-primary">
                    {userData?.current_usage.totalDocumentScans || 0} /{" "}
                    {userData?.subscription.subscription_plans.max_total_document_scans || "3"}
                  </span>
                </div>
                <div className="w-full bg-card-dark rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300 bg-accent-lime"
                    style={{
                      width: `${Math.min(
                        ((userData?.current_usage.totalDocumentScans || 0) /
                          (userData?.subscription.subscription_plans.max_total_document_scans || 3)) *
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-12">
        <div>
          <div className="flex items-center gap-2 group relative">
            <h2 className="text-2xl font-bold text-text-primary">
              ファイルライブラリ
            </h2>
            <div className="relative">
              <HelpCircle className="h-5 w-5 text-gray-400 hover:text-text-primary transition-colors cursor-help" />
              <div className="absolute left-8 top-1/2 -translate-y-1/2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <div className="bg-card-light border border-card-dark rounded-lg shadow-lg p-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    ファイルを作ることで、状況に合わせた情報（コンテクスト）を書き込めます。
                    そうすることで、あなたにピッタリ合った、より正確で的確な回答を作れるようになります。
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            よく聞かれる質問と自分の答えをファイルにまとめておくと、面接などでその内容に沿った自然で一貫した回答ができるようになります。ESなどがおすすめ
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/new">
            <Button className="bg-text-primary text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4" />
              ファイルを作成
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      {collections.length === 0 ? (
        <Card className="text-center py-12 bg-card-light backdrop-blur-md border-0 shadow-sm rounded-container">
          <CardContent>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-accent-light">
              <FolderOpen className="h-6 w-6 text-text-primary" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              ファイルがありません
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              最初のファイルを作成しましょう
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard/new">
                <Button className="bg-text-primary text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium">
                  <Plus className="h-4 w-4" />
                  ファイルを作成
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
              className="bg-card-light backdrop-blur-md border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-container group relative"
            >
              {/* Delete button */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(collection);
                }}
                disabled={deleting === collection.id}
                className="absolute top-2 right-2 z-10 w-8 h-8 p-0 rounded-full bg-card-light hover:bg-red-50 border-card-dark hover:border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {deleting === collection.id ? (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                ) : (
                  <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
                )}
              </Button>

              <Link href={`/dashboard/collections/${collection.id}`} className="block">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base pr-8">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-light">
                      <FolderOpen className="h-4 w-4 text-text-primary" />
                    </div>
                    <span className="text-text-primary font-semibold truncate">
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
                    <div className="flex items-center gap-1 text-text-primary">
                      <FileText className="h-3 w-3" />
                      <span className="font-medium">
                        {collection.qna_count || 0} 項目
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
