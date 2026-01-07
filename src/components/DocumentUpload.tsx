"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { clientUsageEnforcement } from "@/lib/usage-enforcement";

interface DocumentUploadProps {
  collectionId: string;
  onUploadComplete: (documentId: string) => void;
  onCancel: () => void;
}

export default function DocumentUpload({
  collectionId,
  onUploadComplete,
  onCancel
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'text/markdown'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('対応していないファイル形式です。PDF, TXT, MDのみ対応しています。');
        return;
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('ファイルサイズが大きすぎます（上限50MB）。');
        return;
      }

      setSelectedFile(file);
      setError("");
      setProgress(0);
      setStatusText("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    setProgress(0);
    setStatusText("準備中...");

    // Simulated progress timer
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90; // Hold at 90%

        // Dynamic speed based on progress
        const increment = prev < 30 ? 5 : prev < 60 ? 2 : 1;

        // Update status text based on progress
        const newProgress = prev + increment;
        if (newProgress < 30) setStatusText("アップロード中...");
        else if (newProgress < 60) setStatusText("ドキュメントを解析中...");
        else setStatusText("インデックスを作成中...");

        return newProgress;
      });
    }, 500);

    try {
      // Check usage limits first
      const canScan = await clientUsageEnforcement.canScanDocument();
      if (!canScan.allowed) {
        throw new Error(canScan.reason || "ドキュメントスキャン制限に達しました");
      }

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証が必要です');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('collectionId', collectionId);

      // Upload document
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'LIMIT_REACHED') {
          throw new Error(result.message || 'ドキュメントスキャン制限に達しました');
        }
        throw new Error(result.error || 'アップロードに失敗しました');
      }

      // Complete
      clearInterval(progressInterval);
      setProgress(100);
      setStatusText("完了しました！");

      // Small delay to show completion state
      setTimeout(() => {
        onUploadComplete(result.documentId);
      }, 500);

    } catch (err: unknown) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
      setUploading(false);
    }
  };

  return (
    <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-black">文書をアップロード</h3>
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="rounded-full w-8 h-8 p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <Label className="text-sm font-semibold text-gray-900">
              ファイルを選択
            </Label>
            <p className="text-xs text-gray-500 -mt-2 mb-2 pt-2">
              PDF, TXT, MD (最大50MB)
            </p>

            <div className="relative group">
              <Input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileSelect}
                disabled={uploading}
                className="cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 h-14 py-2.5 px-4 rounded-xl border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors flex items-center"
              />
            </div>

            {selectedFile && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                  <FileText className="h-5 w-5 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 flex flex-col gap-3">
            {uploading ? (
              <div className="space-y-4 py-1">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium px-1">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="animate-pulse">{statusText}</span>
                  </div>
                  <span>{progress}%</span>
                </div>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-3 text-sm font-semibold shadow-lg shadow-black/5 disabled:shadow-none transition-all h-12"
                >
                  アップロードを開始
                </Button>

                <Button
                  onClick={onCancel}
                  variant="ghost"
                  className="w-full rounded-xl py-3 text-sm text-gray-500 hover:text-gray-900 hover:bg-transparent h-10"
                >
                  キャンセル
                </Button>
              </>
            )}
          </div>

          <div className="text-[10px] text-gray-400 text-center px-4 leading-relaxed mt-2">
            文書はセキュアにアップロードされ、自動的にインデックス化されます。完了後、この文書を使用してRAGクエリを実行できます。
          </div>
        </div>
      </CardContent>
    </Card>
  );
}