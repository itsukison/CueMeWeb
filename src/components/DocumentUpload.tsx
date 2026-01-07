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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Supported: PDF, PNG, JPEG, TXT, DOCX, PPTX');
        return;
      }

      // Validate file size (100MB limit for File Search)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size exceeds 100MB limit.');
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      // Check usage limits first
      const canScan = await clientUsageEnforcement.canScanDocument();
      if (!canScan.allowed) {
        throw new Error(canScan.reason || "Document scan limit exceeded");
      }

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('collectionId', collectionId);

      // Upload document to File Search (replaces old upload + process flow)
      const response = await fetch('/api/documents/upload-filesearch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'LIMIT_REACHED') {
          throw new Error(result.message || 'Document scan limit reached');
        }
        throw new Error(result.error || 'Upload failed');
      }

      // File Search handles indexing automatically in the background
      // No separate processing step needed
      onUploadComplete(result.fileId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
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
              PDF, PNG, JPEG, TXT, DOCX, PPTX (最大100MB)
            </p>

            <div className="relative group">
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.docx,.pptx"
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
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-3 text-sm font-semibold shadow-lg shadow-black/5 disabled:shadow-none transition-all h-12"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  アップロード中...
                </>
              ) : (
                <>
                  アップロードを開始
                </>
              )}
            </Button>

            <Button
              onClick={onCancel}
              variant="ghost"
              disabled={uploading}
              className="w-full rounded-xl py-3 text-sm text-gray-500 hover:text-gray-900 hover:bg-transparent h-10"
            >
              キャンセル
            </Button>
          </div>

          <div className="text-[10px] text-gray-400 text-center px-4 leading-relaxed mt-2">
            文書はセキュアにアップロードされ、自動的にインデックス化されます。完了後、この文書を使用してRAGクエリを実行できます。
          </div>
        </div>
      </CardContent>
    </Card>
  );
}