"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

function DowngradeForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetPlan = searchParams.get("plan");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (targetPlan) {
      checkDowngradeRequirements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPlan]);

  const checkDowngradeRequirements = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in");
      }

      // Get current subscription to show scheduled date
      const response = await fetch("/api/subscriptions/user", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data");
      }

      const data = await response.json();
      setLoading(false);
      // Just show the scheduling confirmation, no file selection yet
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to check downgrade requirements"
      );
      setLoading(false);
    }
  };



  const handleScheduleDowngrade = async () => {
    setProcessing(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in");
      }

      const response = await fetch("/api/subscriptions/schedule-downgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetPlanName: targetPlan,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard/subscription?scheduled=true");
      } else {
        setError(data.error || "Failed to schedule downgrade");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to schedule downgrade"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-700">
          Checking downgrade requirements...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-6">
        <Link href="/dashboard/subscription">
          <Button variant="outline" className="rounded-full px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subscription
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-12 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#013220" }}>
            {targetPlan === "Free" ? "フリー" : targetPlan === "Basic" ? "ベーシック" : "プレミアム"}プランへダウングレード
          </h1>
          <p className="text-gray-600">ダウングレードのスケジュール確認</p>
        </div>

        {/* Info Card */}
        <Card className="bg-[#F7F7EE] border-[#013220] rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3" style={{ color: "#013220" }}>
              <AlertTriangle className="h-6 w-6" />
              ダウングレードについて
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm" style={{ color: "#013220" }}>
              ダウングレードは現在の請求期間の終了時に実行されます。それまでは現在のプランの全機能をご利用いただけます。
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside" style={{ color: "#013220" }}>
              <li>請求期間終了まで現在のプランの機能を利用可能</li>
              <li>ファイル数が新プランの上限を超える場合、期間終了時に選択が必要</li>
              <li>いつでもダウングレードをキャンセル可能</li>
            </ul>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link href="/dashboard/subscription">
            <Button variant="outline" className="rounded-full px-6 border-[#013220] text-[#013220] hover:bg-[#F7F7EE]">
              キャンセル
            </Button>
          </Link>
          <Button
            onClick={handleScheduleDowngrade}
            disabled={processing}
            className="rounded-full px-6 text-white hover:opacity-90"
            style={{ backgroundColor: "#013220" }}
          >
            {processing
              ? "処理中..."
              : `${targetPlan === "Free" ? "フリー" : targetPlan === "Basic" ? "ベーシック" : "プレミアム"}プランへのダウングレードを予約`}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-500">
          <p>
            ダウングレード後もファイルは削除されません。プランをアップグレードすることで再度アクセス可能になります。
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DowngradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-16 flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto px-6">
          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-orange-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-black">
                プラン変更準備中...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                ファイル情報を読み込み中...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <DowngradeForm />
    </Suspense>
  );
}
