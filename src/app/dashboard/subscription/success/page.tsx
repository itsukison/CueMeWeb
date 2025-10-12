"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

function SubscriptionSuccessForm() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give some time for webhook to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-black">
              サブスクリプション登録完了！
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div>
                <p className="text-gray-600 mb-4">
                  サブスクリプション情報を処理中...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full animate-pulse"
                    style={{ width: "70%" }}
                  ></div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600">
                  サブスクリプションが正常にアクティベートされました！新しいプランのすべての機能をご利用いただけます。
                </p>

                <div className="flex flex-col gap-3 pt-4">
                  <Link href="/dashboard">
                    <Button className="w-full bg-black text-white hover:bg-gray-900 rounded-full">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      ダッシュボードへ
                    </Button>
                  </Link>

                  <Link href="/dashboard/subscription">
                    <Button variant="outline" className="w-full rounded-full">
                      サブスクリプション詳細を見る
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6">
          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-black">
                処理中...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                サブスクリプション情報を確認中...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <SubscriptionSuccessForm />
    </Suspense>
  );
}
