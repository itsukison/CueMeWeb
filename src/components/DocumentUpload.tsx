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
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only PDF, PNG, and JPEG files are allowed.');
        return;
      }

      // Validate file size (15MB limit)
      const maxSize = 15 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size exceeds 15MB limit.');
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
          throw new Error(result.message || 'Document scan limit reached');
        }
        throw new Error(result.error || 'Upload failed');
      }

      // Start processing
      const processResponse = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          documentId: result.documentId,
          processingOptions: {
            segmentationStrategy: 'auto',
            questionTypes: ['factual', 'conceptual'],
            maxQuestionsPerSegment: 3,
            qualityThreshold: 0.7,
            language: 'ja',
            reviewRequired: false
          }
        })
      });

      if (!processResponse.ok) {
        const processResult = await processResponse.json();
        throw new Error(processResult.error || 'Failed to start processing');
      }

      onUploadComplete(result.documentId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-md border border-gray-200 shadow-sm rounded-xl">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">文書をアップロード</h3>
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="rounded-lg px-3 py-1 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              ファイルを選択 (PDF, PNG, JPEG - 最大15MB)
            </Label>
            
            <div className="relative">
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                disabled={uploading}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 flex-1">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-black text-white hover:bg-gray-900 rounded-lg px-6 py-2 text-sm font-medium flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  アップロード中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  アップロード & 処理開始
                </>
              )}
            </Button>
            
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={uploading}
              className="rounded-lg px-6 py-2 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• 文書は自動的に処理され、Q&Aペアが生成されます</p>
            <p>• 処理には数分かかる場合があります</p>
            <p>• 処理完了後、生成されたQ&Aがこのコレクションに追加されます</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}