"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen py-16 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-black">
              Subscription Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your subscription upgrade was cancelled. No charges were made to
              your account.
            </p>

            <div className="space-y-3 pt-4">
              <Link href="/dashboard/subscription">
                <Button className="w-full bg-black text-white hover:bg-gray-900 rounded-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button variant="outline" className="w-full rounded-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <div className="text-sm text-gray-500 pt-4">
              You can continue using your current plan without any interruption.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
