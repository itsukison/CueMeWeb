"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

export default function DowngradePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetPlan = searchParams.get("plan");

  const [files, setFiles] = useState<FileWithCount[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [maxFilesAllowed, setMaxFilesAllowed] = useState(0);
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

      const response = await fetch("/api/subscriptions/downgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ targetPlanName: targetPlan }),
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
      } else if (data.success) {
        // Downgrade successful, redirect to subscription page
        router.push("/dashboard/subscription?downgraded=true");
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to check downgrade requirements"
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

  const handleDowngrade = async () => {
    if (selectedFileIds.length !== maxFilesAllowed) {
      setError(`Please select exactly ${maxFilesAllowed} files to keep`);
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in");
      }

      const response = await fetch("/api/subscriptions/downgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetPlanName: targetPlan,
          keepFileIds: selectedFileIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard/subscription?downgraded=true");
      } else {
        setError(data.error || "Failed to process downgrade");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process downgrade"
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
          <h1 className="text-3xl font-bold text-black mb-2">
            Downgrade to {targetPlan} Plan
          </h1>
          <p className="text-gray-600">Select which files to keep active</p>
        </div>

        {/* Warning Card */}
        <Card className="bg-yellow-50 border-yellow-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-yellow-800">
              <AlertTriangle className="h-6 w-6" />
              File Selection Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 text-sm">
              You currently have {files.length} files, but the {targetPlan} plan
              only allows {maxFilesAllowed}. Please select {maxFilesAllowed}{" "}
              file{maxFilesAllowed !== 1 ? "s" : ""} to keep active. The
              remaining files will be deactivated but not deleted.
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
              Select {maxFilesAllowed} file{maxFilesAllowed !== 1 ? "s" : ""} to
              keep ({selectedFileIds.length}/{maxFilesAllowed} selected)
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
                      ? "border-blue-500 bg-blue-50"
                      : canSelect
                      ? "border-gray-200 hover:border-gray-300"
                      : "border-gray-100 bg-gray-50 opacity-50"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleFileSelection(file.fileId, checked as boolean)
                    }
                    disabled={!canSelect}
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-black">
                        {file.fileName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {file.qnaCount} QnA item{file.qnaCount !== 1 ? "s" : ""}
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
            <Button variant="outline" className="rounded-full px-6">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleDowngrade}
            disabled={selectedFileIds.length !== maxFilesAllowed || processing}
            className="bg-black text-white hover:bg-gray-900 rounded-full px-6"
          >
            {processing
              ? "Processing..."
              : `Confirm Downgrade to ${targetPlan}`}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Deactivated files will not be deleted and can be reactivated by
            upgrading your plan.
          </p>
        </div>
      </div>
    </div>
  );
}
