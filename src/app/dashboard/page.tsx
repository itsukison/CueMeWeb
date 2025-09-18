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
} from "lucide-react";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  qna_count?: number;
}

interface Document {
  id: string;
  display_name: string;
  file_name: string;
  chunk_count: number;
  created_at: string;
  status: string;
}

interface CombinedItem {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  count: number;
  type: 'collection' | 'document';
  status?: string;
}

interface SubscriptionPlan {
  name: string;
  price_jpy: number;
  max_files: number;
  max_qna_files: number;
  max_scanned_documents: number;
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
    qna_files_used: number;
    scanned_documents_used: number;
    current_month: string;
  };
  current_usage: {
    qna_files: number;
    documents: number;
  };
}

export default function DashboardPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Fetch collections, documents, and user data independently for better performance
    fetchCollections();
    fetchDocuments();
    fetchUserData();
  }, []);

  useEffect(() => {
    // Combine collections and documents when either changes
    const combined: CombinedItem[] = [
      ...collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        created_at: collection.created_at,
        count: collection.qna_count || 0,
        type: 'collection' as const
      })),
      ...documents.map(document => ({
        id: document.id,
        name: document.display_name || document.file_name,
        description: `${document.chunk_count} chunks`,
        created_at: document.created_at,
        count: document.chunk_count,
        type: 'document' as const,
        status: document.status
      }))
    ];

    // Sort by creation date, newest first
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setCombinedItems(combined);
  }, [collections, documents]);

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
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Only show completed documents
        const completedDocuments = (result.documents || []).filter(
          (doc: Document) => doc.status === 'completed'
        );
        setDocuments(completedDocuments);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
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

  const handleDelete = async (item: CombinedItem) => {
    if (!confirm(`「${item.name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setDeleting(item.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      if (item.type === 'collection') {
        // Delete QNA collection using API
        const response = await fetch('/api/collections', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ collectionId: item.id })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete collection');
        }

        // Update local state
        setCollections(prev => prev.filter(c => c.id !== item.id));
      } else {
        // Delete document
        const response = await fetch('/api/documents', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ documentId: item.id })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete document');
        }

        // Update local state
        setDocuments(prev => prev.filter(d => d.id !== item.id));
      }

      // Refresh user data to update usage counts
      fetchUserData();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete item');
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
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="text-center">
                <div className="font-semibold text-base text-black">
                  {userData?.subscription.subscription_plans.max_qna_files || "1"}
                </div>
                <div className="text-gray-600 text-xs">Q&Aファイル</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-base text-black">
                  {userData?.subscription.subscription_plans.max_scanned_documents || "1"}
                </div>
                <div className="text-gray-600 text-xs">文書ファイル</div>
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
                  <span className="text-xs font-medium text-gray-700">文書ファイル</span>
                  <span className="text-xs font-semibold text-black">
                    {userData?.current_usage.documents || documents.length} /{" "}
                    {userData?.subscription.subscription_plans.max_scanned_documents || "1"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: "#013220",
                      width: `${Math.min(
                        ((userData?.current_usage.documents || documents.length) /
                          (userData?.subscription.subscription_plans.max_scanned_documents || 1)) *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">Q&Aファイル</span>
                  <span className="text-xs font-semibold text-black">
                    {userData?.current_usage.qna_files || collections.length} /{" "}
                    {userData?.subscription.subscription_plans.max_qna_files || "1"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: "#013220",
                      width: `${Math.min(
                        ((userData?.current_usage.qna_files || collections.length) /
                          (userData?.subscription.subscription_plans.max_qna_files || 1)) *
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
            コンテンツライブラリ
          </h2>
          <p className="text-gray-600 text-sm">
            質問回答コレクションと処理済み文書を管理
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/collections/new">
            <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium">
              <Plus className="h-4 w-4" />
              Q&A作成
            </Button>
          </Link>
          <Link href="/dashboard/documents">
            <Button variant="outline" className="rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium border-gray-300">
              <FileText className="h-4 w-4" />
              文書アップロード
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Grid */}
      {combinedItems.length === 0 ? (
        <Card className="text-center py-12 bg-white/70 backdrop-blur-md border-0 shadow-sm rounded-2xl">
          <CardContent>
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "#f0f9f0" }}
            >
              <FolderOpen className="h-6 w-6" style={{ color: "#013220" }} />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              コンテンツがありません
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              最初のコンテンツを作成しましょう
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard/collections/new">
                <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium">
                  <Plus className="h-4 w-4" />
                  Q&A作成
                </Button>
              </Link>
              <Link href="/dashboard/documents">
                <Button variant="outline" className="rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium border-gray-300">
                  <FileText className="h-4 w-4" />
                  文書アップロード
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combinedItems.map((item) => (
            <Card
              key={`${item.type}-${item.id}`}
              className="bg-white/70 backdrop-blur-md border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl group relative"
            >
              {/* Delete button */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(item);
                }}
                disabled={deleting === item.id}
                className="absolute top-2 right-2 z-10 w-8 h-8 p-0 rounded-full bg-white/80 hover:bg-red-50 border-gray-200 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {deleting === item.id ? (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                ) : (
                  <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
                )}
              </Button>

              <Link href={item.type === 'collection' ? `/dashboard/collections/${item.id}` : `/dashboard/documents`} className="block">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base pr-8">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#f0f9f0" }}
                    >
                      {item.type === 'collection' ? (
                        <FolderOpen
                          className="h-4 w-4"
                          style={{ color: "#013220" }}
                        />
                      ) : (
                        <FileText
                          className="h-4 w-4"
                          style={{ color: "#013220" }}
                        />
                      )}
                    </div>
                    <span className="text-black font-semibold truncate">
                      {item.name}
                    </span>
                    {item.type === 'document' && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        文書
                      </Badge>
                    )}
                  </CardTitle>
                  {item.description && (
                    <CardDescription className="text-gray-600 text-sm line-clamp-2">
                      {item.description}
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
                        {item.count} {item.type === 'collection' ? '項目' : 'チャンク'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(item.created_at).toLocaleDateString()}
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
