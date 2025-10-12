"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ArrowLeft, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

interface FileWithCount {
  fileId: string;
  fileName: string;
  qnaCount: number;
}

export default function ExecuteDowngradePage() {
  const router = useRouter();

  const [files, setFiles] = useState<FileWithCount[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [maxFilesAllowed, setMaxFilesAllowed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [targetPlan, setTargetPlan] = useState("");

  useEffect(() => {
    checkDowngradeStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkDowngradeStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("サインインしてください");
      }

      // Try to execute downgrade to see if file selection is needed
      const response = await fetch("/api/subscriptions/execute-downgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.requiresFileSelection) {
        setFiles(data.currentFiles);
        setMaxFilesAllowed(data.maxFilesAllowed);
        // Pre-select files up to the limit
        setSelectedFileIds(
          data.currentFiles
            .slice(0, data.maxFilesAllowed)
            .map((f: FileWithCount) => f.fileId)
        );
        
        // Get target plan name from pending downgrade
        const pendingResponse = await fetch("/api/subscriptions/pending-downgrade", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const pendingData = await pendingResponse.json();
        setTargetPlan(pendingData.pendingDowngrade?.target_plan?.name || "");
      } else if (data.success) {
        // Downgrade completed without file selection
        router.push("/dashboard/subscription?downgraded=true");
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ダウングレード状態の確認に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelection = (fileId: string, checked: boolean) => {
    if (checked) {
      if (selectedFileIds.length < maxFilesAllowed) {
        setSelectedFileIds([...selectedFileIds, fileId]);
      }
    } else {
      setSelectedFileIds(selectedFileIds.filter((id) => id !== fileId));
    }
  };

  const handleExecuteDowngrade = async () => {
    if (selectedFileIds.length !== maxFilesAllowed) {
      setError(`${maxFilesAllowed}個のファイルを選択してください`);
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("サインインしてください");
      }

      const response = await fetch("/api/subscriptions/execute-downgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          keepFileIds: selectedFileIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard/subscription?downgraded=true");
      } else {
        setError(data.error || "ダウングレードの実行に失敗しました");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ダウングレードの実行に失敗しました"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-700">
          ダウングレード状態を確認中...
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
            サブスクリプションに戻る
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-12 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#013220" }}>
            {targetPlan === "Free" ? "フリー" : targetPlan === "Basic" ? "ベーシック" : "プレミアム"}プランへダウングレード
          </h1>
          <p className="text-gray-600">保持するファイルを選択してください</p>
        </div>

        {/* Warning Card */}
        <Card className="bg-[#FFF8E1] border-[#013220] rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3" style={{ color: "#013220" }}>
              <AlertTriangle className="h-6 w-6" />
              ファイル選択が必要です
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{ color: "#013220" }}>
              現在{files.length}個のファイルがありますが、{targetPlan === "Free" ? "フリー" : targetPlan === "Basic" ? "ベーシック" : "プレミアム"}プランでは{maxFilesAllowed}個までしか保持できません。
              {maxFilesAllowed}個のファイルを選択してください。選択されなかったファイルは非アクティブ化されますが、削除されません。
            </p>
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

        {/* File Selection */}
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle>
              {maxFilesAllowed}個のファイルを選択 ({selectedFileIds.length}/{maxFilesAllowed} 選択済み)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file) => {
              const isSelected = selectedFileIds.includes(file.fileId);
              const canSelect =
                isSelected || selectedFileIds.length < maxFilesAllowed;

              return (
                <div
                  key={file.fileId}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "bg-[#E8F5E9]"
                      : canSelect
                      ? "border-gray-200 hover:border-[#013220]"
                      : "border-gray-100 bg-gray-50 opacity-50"
                  }`}
                  style={isSelected ? { borderColor: "#013220" } : {}}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleFileSelection(file.fileId, checked as boolean)
                    }
                    disabled={!canSelect}
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E8F5E9" }}>
                      <FileText className="h-5 w-5" style={{ color: "#013220" }} />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: "#013220" }}>
                        {file.fileName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {file.qnaCount} QnA
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link href="/dashboard/subscription">
            <Button variant="outline" className="rounded-full px-6 border-[#013220] text-[#013220] hover:bg-[#F7F7EE]">
              キャンセル
            </Button>
          </Link>
          <Button
            onClick={handleExecuteDowngrade}
            disabled={selectedFileIds.length !== maxFilesAllowed || processing}
            className="rounded-full px-6 text-white hover:opacity-90"
            style={{ backgroundColor: "#013220" }}
          >
            {processing
              ? "処理中..."
              : `${targetPlan === "Free" ? "フリー" : targetPlan === "Basic" ? "ベーシック" : "プレミアム"}プランへダウングレード`}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-500">
          <p>
            非アクティブ化されたファイルは削除されません。プランをアップグレードすることで再度アクセス可能になります。
          </p>
        </div>
      </div>
    </div>
  );
}
