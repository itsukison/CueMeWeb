"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { stripePromise } from "@/lib/stripe-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Crown,
  Star,
  Gift,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionPlan {
  id: string;
  name: string;
  price_jpy: number;
  max_files: number;
  max_qnas_per_file: number;
  max_monthly_questions: number;
  stripe_price_id: string | null;
}

interface UserSubscription {
  subscription_plans: SubscriptionPlan;
  status: string;
}

interface UserData {
  subscription: UserSubscription;
  usage: {
    questions_used: number;
    current_month: string;
  };
  current_usage: {
    files: number;
  };
}

export default function SubscriptionPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchUserData(), fetchAllPlans()]);
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to view subscription details");
      }

      const response = await fetch("/api/subscriptions/user", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data");
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscription data"
      );
    }
  };

  const fetchAllPlans = async () => {
    try {
      const response = await fetch("/api/subscriptions/plans");
      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }

      const data = await response.json();
      setAllPlans(data.plans || []);
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    setUpgradeLoading(planName);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to upgrade");
      }

      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start upgrade process"
      );
    } finally {
      setUpgradeLoading(null);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in");
      }

      const response = await fetch("/api/subscriptions/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to access billing portal");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to access billing portal"
      );
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "Free":
        return <Gift className="h-6 w-6" />;
      case "Basic":
        return <Star className="h-6 w-6" />;
      case "Premium":
        return <Crown className="h-6 w-6" />;
      default:
        return <Gift className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case "Free":
        return "bg-gray-100 text-gray-800";
      case "Basic":
        return "bg-blue-100 text-blue-800";
      case "Premium":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-700">
          Loading subscription details...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-full px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600">
            Manage your CueMe subscription and usage
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Current Subscription & Usage */}
        {userData && (
          <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
            {/* Current Plan */}
            <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {getPlanIcon(userData.subscription.subscription_plans.name)}
                  <span>Current Plan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">
                    {userData.subscription.subscription_plans.name}
                  </span>
                  <Badge
                    className={getPlanColor(
                      userData.subscription.subscription_plans.name
                    )}
                  >
                    {userData.subscription.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">
                      {userData.subscription.subscription_plans.price_jpy === 0
                        ? "Free"
                        : `¥${userData.subscription.subscription_plans.price_jpy}/month`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Files:</span>
                    <span className="font-medium">
                      {userData.subscription.subscription_plans.max_files}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>QnAs per File:</span>
                    <span className="font-medium">
                      {
                        userData.subscription.subscription_plans
                          .max_qnas_per_file
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Questions:</span>
                    <span className="font-medium">
                      {
                        userData.subscription.subscription_plans
                          .max_monthly_questions
                      }
                    </span>
                  </div>
                </div>

                {userData.subscription.subscription_plans.stripe_price_id && (
                  <Button
                    onClick={handleBillingPortal}
                    variant="outline"
                    className="w-full rounded-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6" />
                  <span>Current Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Files Used:</span>
                    <span className="font-medium">
                      {userData.current_usage.files} /{" "}
                      {userData.subscription.subscription_plans.max_files}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (userData.current_usage.files /
                            userData.subscription.subscription_plans
                              .max_files) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Questions This Month:</span>
                    <span className="font-medium">
                      {userData.usage.questions_used} /{" "}
                      {
                        userData.subscription.subscription_plans
                          .max_monthly_questions
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (userData.usage.questions_used /
                            userData.subscription.subscription_plans
                              .max_monthly_questions) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-2">
                  Usage resets on the 1st of each month
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Available Plans */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Available Plans
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {allPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl ${
                  userData?.subscription.subscription_plans.name === plan.name
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              >
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    {plan.price_jpy === 0 ? "Free" : `¥${plan.price_jpy}/month`}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>
                        {plan.max_files} file{plan.max_files !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>{plan.max_qnas_per_file} QnAs per file</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>{plan.max_monthly_questions} questions/month</span>
                    </div>
                  </div>

                  {userData?.subscription.subscription_plans.name ===
                  plan.name ? (
                    <Badge className="w-full justify-center py-2">
                      Current Plan
                    </Badge>
                  ) : plan.price_jpy === 0 ? (
                    (userData?.subscription.subscription_plans.price_jpy ?? 0) >
                    0 ? (
                      <Link
                        href={`/dashboard/subscription/downgrade?plan=${plan.name}`}
                      >
                        <Button
                          variant="outline"
                          className="w-full rounded-full"
                        >
                          Downgrade to Free
                        </Button>
                      </Link>
                    ) : (
                      <div className="text-center text-sm text-gray-500">
                        Always Free
                      </div>
                    )
                  ) : (userData?.subscription.subscription_plans.price_jpy ??
                      0) > plan.price_jpy ? (
                    <Link
                      href={`/dashboard/subscription/downgrade?plan=${plan.name}`}
                    >
                      <Button variant="outline" className="w-full rounded-full">
                        Downgrade
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() =>
                        handleUpgrade(plan.name)
                      }
                      disabled={upgradeLoading === plan.name}
                      className="w-full rounded-full"
                    >
                      {upgradeLoading === plan.name
                        ? "Processing..."
                        : "Upgrade"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
